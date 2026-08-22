from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

# Create your models here.
class Language(models.Model):
    code = models.CharField(max_length=4)
    name = models.CharField(max_length=100)
    extra_chars = models.CharField(max_length=255, null=True, blank=True) # characters to include in lemmas outside the A-z range. For English this will be "âçèéêïñôü" (maybe -). These were all found in the BNC/COCA wordlist and are obviously only in borrowed words.
    # the idea is that including characters outside the normal range will trigger a warning and maybe even block the creation of the lemma in this language. Even better would be to normalise anything that doesn't correspond, so ´ as a dicritic instead of é could be resolved somehow.
    # This way, when finding examples, we should be working from clean text.
    # note that extra_chars will need to be adapted for languages like chinese… perhaps by allowing a unicode range instead?
    
    def __str__(self):
        return self.name
    
class Dialect(models.Model):
    language = models.ForeignKey(Language, on_delete=models.CASCADE)
    subDialectOf = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True) # a dialect can be a sub-dialect of another dialect (e.g. British English includes Scottish English, which includes Shetlandic English, which includes Norn English)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=6) # e.g. en-GB, en-US, fr-FR, fr-CA etc.
    
    def __str__(self):
        return self.name
    
    def isSubDialect(self):
        return self.subDialectOf != None
    
class WordClass(models.Model): # e.g. noun, verb…
    name = models.CharField(max_length=100)
    languages = models.ManyToManyField(Language, related_name='word_classes')

    # to do: make sure name + language are unique together, so that we don't have two nouns in English, for example. This will be important for the UI to work properly.

    def __str__(self):
        return self.name
    
class ChunkClass(models.Model): # e.g. phrasal verb, idiom, noun phrase…
    name = models.CharField(max_length=100)
    languages = models.ManyToManyField(Language, related_name='chunk_classes')    

    # to do: make sure name + language are unique together, so that we don't have two nouns in English, for example. This will be important for the UI to work properly.

    def __str__(self):
        return self.name


class IPA(models.Model):
    text = models.CharField(max_length=1023)
    language = models.ForeignKey(Language, on_delete=models.CASCADE)
    dialect = models.ForeignKey(Dialect, on_delete=models.CASCADE, null=True, blank=True) # use the lowest level dialect    

    def __str__(self):
        return self.text

class Lemma(models.Model):
    # Lemmas and Types should NEVER contain spaces.
    language = models.ForeignKey(Language, on_delete=models.CASCADE)
    dialect = models.ForeignKey(Dialect, on_delete=models.SET_NULL, null=True, blank=True) # use the lowest relevant level dialect    
    word_class = models.ForeignKey(WordClass, on_delete=models.SET_NULL, null=True)
    headword_text = models.CharField(max_length=255) # possibly need to remove this as it's redundant with the types, BUT　it might speed up searching/indexing in some cases
    frequency_rank = models.IntegerField(blank=True, null=True) # 1 is the most common word etc. -1 means unknown. We might have a ceiling where all extremely uncommon words have the same very high number (possibly higher than the real one)
    word_family_frequency_band = models.IntegerField(blank=True, null=True) # in 1K groups, e.g. 1 = in the 1000th most common words, 2 = in the 2000 most common words (but not 1000) etc.
    tags = models.ManyToManyField('Tag', related_name='lemma_uses', blank=True) # tags can be added at the lemma level to indicate a particular usage of the word. if a unique tag type, it will override the one in the Vocab

    source = models.CharField(max_length=255, null=True, blank=True) # source of the lemma, e.g. a dictionary or corpus.
    # types: one to many

    # in theory, a lemma's headword+word_class+language combination is unique (there shouldn't be two lemmas with the same combination), EXCEPT there will be exceptions, like lead in English!

    # def update_headword(self):
        # to do: check the headword corresponds to the stored type
        # (can I mutate the model here?)
    
    def __str__(self):
        return self.headword_text
    

    
class Type(models.Model):
    language = models.ForeignKey(Language, on_delete=models.CASCADE)
    lemma = models.ForeignKey(Lemma, on_delete=models.CASCADE, related_name='types')
    text = models.CharField(max_length=255)    
    is_headword = models.BooleanField()
    ipa = models.ForeignKey(IPA, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField('Tag', related_name='type_uses', blank=True) # tags can be added at the type level to indicate a particular usage of the word. if a unique tag type, it will override the one in the Vocab

    source = models.CharField(max_length=255, null=True, blank=True) # source of the type, e.g. a dictionary or corpus.

    # Only use this for when the lemma has an orthographical variant for a specific dialect.
    dialect = models.ForeignKey(Dialect, on_delete=models.SET_NULL, null=True, blank=True) # use the lowest relevant level dialect.

    def __str__(self):
        return self.text
    

class Chunk(models.Model):    
    language = models.ForeignKey(Language, on_delete=models.CASCADE)
    dialect = models.ForeignKey(Dialect, on_delete=models.SET_NULL, null=True, blank=True) # use the lowest relevant level dialect        
    text = models.CharField(max_length=1023)
    lemmas = models.ManyToManyField(Lemma)
    chunk_class = models.ForeignKey(ChunkClass, on_delete=models.SET_NULL, null=True)
    ipa = models.ForeignKey(IPA, on_delete=models.SET_NULL, null=True, blank=True)
    source = models.CharField(max_length=255, null=True, blank=True) # source of the chunk, e.g. a dictionary or corpus.

    # do we want to account for variants? …probably!

    def __str__(self):
        return self.text

    
class TagType(models.Model):

    name = models.CharField(max_length=100)
    unique = models.BooleanField() # unique tags are tags that can only be present if no other tag shares the same type in the same vocab, for example gender or register
    word_class_restrictions = models.ManyToManyField(WordClass, related_name='tags', blank=True) # if a tag type has word class restrictions, it can only be applied to vocabs of that word class. For example,
    chunk_class_restrictions = models.ManyToManyField(ChunkClass, related_name='tags', blank=True) # if a tag type has chunk class restrictions, it can only be applied to vocabs of that chunk class. For example, a tag type "idiom" can only be applied to vocabs of the chunk class "idiom"

    lemma_level = models.BooleanField(default=False) 
    type_level = models.BooleanField(default=False) # tags at this level are types like "number" (singular/plural) or "person" (first/second/third)
    vocab_level = models.BooleanField(default=True) # by default a tag type can be applied to a vocab, but not necessarily to a lemma or type. For example, a tag type "register" can be applied to a vocab, but not to a lemma or type.
    definition_level = models.BooleanField(default=True)
    translation_level = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Tag(models.Model):
    languages = models.ManyToManyField(Language, related_name='tags')
    tag_type = models.ManyToManyField(TagType, related_name='tags') # to do: add default "generic"?    
    text = models.CharField(max_length=100)

    def __str__(self):
        return self.text


class Vocab(models.Model):
    language = models.ForeignKey(Language, on_delete=models.CASCADE)   

    # we should have a lemma OR a chunk
    lemma = models.ForeignKey(Lemma, related_name='uses', on_delete=models.CASCADE, null=True, blank=True) # a vocab can be a lemma or a chunk, but not both. If a lemma is present, it is a lemma (even if a chunk is added by mistake).
    chunk = models.ForeignKey(Chunk, related_name='uses', on_delete=models.CASCADE, null=True, blank=True)       
    source = models.CharField(max_length=255, null=True, blank=True) # source of the vocab, e.g. a dictionary or corpus.
    tags = models.ManyToManyField(Tag, related_name='uses', blank=True) 
    # UI should also pull up word class or chunk class, plus chunk- lemma-level dialects add display these as tags (type-level dialects should be displayed alongside the variants in the UI)

    # to do: examples!

    # by default, a Vocab is a Lemma. If a lemma is present, it is a lemma (even if a chunk is somehow added by mistake). 
    def isLemma(self):
        return (self.lemma != None)

    def isChunk(self):
        # by default
        return (self.lemma == None and self.chunk != None)
    
    def __str__(self):
        if self.isLemma():
            return str(self.lemma)
        elif self.isChunk():
            return str(self.chunk)
        else:
            return ''
    
    class Meta:
        constraints = [
            models.CheckConstraint(
                name="vocab_exactly_one_of_lemma_chunk",
                condition=(
                    (Q(lemma__isnull=False) & Q(chunk__isnull=True)) |
                    (Q(lemma__isnull=True) & Q(chunk__isnull=False))
                ),
            ),
        ]
    
class Relationship(models.Model): # can be between lemmas and chunks
    class RelationshipTypes(models.TextChoices):
        WoFa = "WoFa", _('word family')
        Syno = "Syno", _('synonym')
        Anto = "Anto", _('antonym')
        HoPh = 'HoPh', _('homophone') # sounds the same (spelled different)
        HoGr = 'HoGr', _('homograph') # spelled the same (sounds different)
        HoNy = 'HoNy', _('homonym') # spelled the same and sounds the same
        HyNy = 'HyNy', _('hyponym') # a hypernym is the umbrella term of a hyponym
    
    relationship_type = models.CharField(max_length=4, choices=RelationshipTypes)
    lemmaX = models.ForeignKey(Lemma, on_delete=models.CASCADE, related_name='relationsX') # for HoNy, this is the hypernym (the umbrella term)
    lemmaY = models.ForeignKey(Lemma, on_delete=models.CASCADE, related_name='relationsY') # for HoNy, this is the hyponym        
    chunkX = models.ForeignKey(Chunk, on_delete=models.CASCADE, related_name='relationsX') # for HoNy, this is the hypernym (the umbrella term)
    chunkY = models.ForeignKey(Chunk, on_delete=models.CASCADE, related_name='relationsY') # for HoNy, this is the hyponym        

    def x(self):
        if self.lemmaX == None:
            # to do: trigger error if chunkX is also null
            return self.chunkX
        else:
            return self.lemmaX
    
    def y(self):
        if self.lemmaY == None:
            # to do: trigger error if chunkY is also null
            return self.chunkY
        else:
            return self.lemmaY
    
    def __str__(self):
        string = '"{self.x}" is {self.relationship_type} of "{self.y}"'
        return string


class Translation(models.Model):
    vocab = models.ForeignKey(Vocab, related_name='translations', on_delete=models.CASCADE)
    into = models.ForeignKey(Language, on_delete=models.CASCADE)
    into_dialects = models.ManyToManyField(Dialect, related_name='translations', blank=True) # use the lowest relevant level dialect (remember this is the dialect of the language translated into)
    text = models.CharField(max_length=255)
    tags = models.ManyToManyField(Tag, related_name='translation_uses', blank=True) # tags can be added at the translation level to indicate a particular usage of the word. if a unique tag type, it will override the one in the Vocab
    # to do: add related definitions?

    source = models.CharField(max_length=255, null=True, blank=True) # source of the translation, e.g. a dictionary or corpus.

    # to do: add link to lemma or chunk in the translated language? 

    def __str__(self):
        return self.text

class Definition(models.Model):
    vocab = models.ForeignKey(Vocab, related_name='definitions', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    tags = models.ManyToManyField(Tag, related_name='definition_uses', blank=True) # tags can be added at the definition level to indicate a particular usage of the word. if a unique tag type, it will override the one in the Vocab
    general_sense = models.BooleanField(blank=True, null=True) # used to indicate that this definition gives a general sense of the word    

    source = models.CharField(max_length=255, null=True, blank=True) # source of the definition, e.g. a dictionary or corpus.

    def __str__(self):
        return self.text

class FunctionTrigger(models.Model):
    # function triggers are essentially grammatical words that will be recognised when adding a new word, triggering a specific word class and being stripped from the Vocab. For example, a user types "to swim", if "to" proceeding a word is set up as a function trigger, it will revert to the lemma "swim" and trigger the verb word class
    language = models.ForeignKey(Language, on_delete=models.CASCADE)    
    text = models.CharField(max_length=100)
    word_class = models.ForeignKey(WordClass, on_delete=models.CASCADE)
    tags = models.ManyToManyField(Tag, related_name='function_triggers', blank=True)
    # optional_tags? suggested_tags?
    proceding = models.BooleanField()
    default_show = models.BooleanField() # Show in front or following lemmas of the word class

    # to do: add conditions (regex on text and/or on ipa and tags to determine whether it should be shown for that word, this will allow us to choose between showing le, la o l' in French… if we ever make this available in French!)

    def following(self):
        return self.proceding == False
    
    def __str__(self):
        return self.text