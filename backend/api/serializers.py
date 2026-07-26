from rest_framework import serializers

from .models import Language, WordClass, ChunkClass, IPA, Lemma, Type, Chunk, TagType, Tag, Vocab, Relationship, Translation, Definition, FunctionTrigger

class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = '__all__'

class WordClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = WordClass
        fields = '__all__'

class ChunkClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChunkClass
        fields = '__all__'

class IPA_Serializer(serializers.ModelSerializer):
    class Meta:
        model = IPA
        fields = '__all__'

class TagTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TagType
        fields = '__all__'


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'



class TypeSerializer(serializers.ModelSerializer):
    ipa_text= serializers.CharField(source='ipa.text', read_only=True)

    class Meta:
        model = Type
        fields = '__all__'

class LemmaSerializer(serializers.ModelSerializer):
    headword = serializers.SerializerMethodField()
    word_class = WordClassSerializer(read_only=True)
    types = TypeSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    def get_headword(self, obj):
        headword = Type.objects.filter(lemma=obj, is_headword=True).first()
        return TypeSerializer(headword).data if headword else None
    
    class Meta:
        model = Lemma
        fields = ['id', 'language', 'dialect', 'word_class', 'frequency_rank', 'word_family_frequency_band', 'tags', 'source', 'types', 'relationsX', 'relationsY', 'headword']        
        read_only_fields = ['id', 'headword']  # Make headword read-only


class ChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chunk
        fields = '__all__'


class RelationshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Relationship
        fields = '__all__'


class TranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Translation
        fields = '__all__'


class DefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Definition
        fields = '__all__'

class VocabSerializer(serializers.ModelSerializer):
    definitions = DefinitionSerializer(many=True)
    translations = TranslationSerializer(many=True)
    lemma = LemmaSerializer(read_only=True)
    chunk = ChunkSerializer(read_only=True)
    is_lemma = serializers.SerializerMethodField()
    is_chunk = serializers.SerializerMethodField()

    def get_is_lemma(self, obj):
        return obj.lemma is not None
    
    def get_is_chunk(self, obj):
        return obj.chunk is not None

    class Meta:
        model = Vocab
        fields = '__all__'    



class FunctionTriggerSerializer(serializers.ModelSerializer):
    class Meta:
        model = FunctionTrigger
        fields = '__all__'
        