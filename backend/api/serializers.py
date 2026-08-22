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

        read_only_fields = ['vocab']


class DefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Definition
        fields = '__all__'

        read_only_fields = ['vocab']

class VocabSerializer(serializers.ModelSerializer):
    definitions = DefinitionSerializer(many=True)
    translations = TranslationSerializer(many=True)
    lemma = LemmaSerializer(read_only=True)
    lemma_id = serializers.PrimaryKeyRelatedField(
        source='lemma',
        queryset=Lemma.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    chunk = ChunkSerializer(read_only=True)
    chunk_id = serializers.PrimaryKeyRelatedField(
        source='chunk',
        queryset=Chunk.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    is_lemma = serializers.SerializerMethodField()
    is_chunk = serializers.SerializerMethodField()
    text = serializers.CharField(source='get_text', read_only=True)
    vocabClass = serializers.CharField(source='get_vocab_class', read_only=True)    
    tags = TagSerializer(many=True, read_only=True, source='get_tags')

    def get_is_lemma(self, obj):
        return obj.lemma is not None
    
    def get_is_chunk(self, obj):
        return obj.chunk is not None

    def get_text(self, obj):
        if obj.lemma:
            headword = Type.objects.filter(lemma=obj.lemma, is_headword=True).first()
            return headword.text if headword else None
        elif obj.chunk:
            return obj.chunk.text
        return None

    def get_vocab_class(self, obj):
        if obj.lemma:
            return obj.lemma.word_class.name if obj.lemma.word_class else None
        elif obj.chunk:
            return obj.chunk.chunk_class.name if obj.chunk.chunk_class else None
        return None

    def get_tags(self, obj):
        if obj.lemma:
            return TagSerializer(obj.lemma.tags.all(), many=True).data
        elif obj.chunk:
            return TagSerializer(obj.chunk.tags.all(), many=True).data
        return []

    def create(self, validated_data):
        definitions_data = validated_data.pop('definitions', [])
        translations_data = validated_data.pop('translations', [])
        vocab = Vocab.objects.create(**validated_data)

        for definition_data in definitions_data:
            Definition.objects.create(vocab=vocab, **definition_data)

        for translation_data in translations_data:
            Translation.objects.create(vocab=vocab, **translation_data)

        return vocab

    def update(self, instance, validated_data):
        definitions_data = validated_data.pop('definitions', [])
        translations_data = validated_data.pop('translations', [])

        # Update the Vocab instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update definitions (you can save processing by not sending definitions if they haven't changed)
        if definitions_data:
            if not definitions_data:
                # If definitions_data is empty, delete all existing definitions
                instance.definitions.all().delete()
            else:
                incoming_definition_ids = [d['id'] for d in definitions_data if 'id' in d]
                for definition_data in definitions_data:
                    # Look for any definitions that are not in the incoming data and delete them
                    for definition in instance.definitions.all():
                        if definition.id not in incoming_definition_ids:
                            definition.delete()
                    # Check if the definition already exists (by id) and update it, otherwise create a new one
                    if 'id' in definition_data:
                        definition = Definition.objects.get(id=definition_data['id'], vocab=instance)
                        if definition:
                            for attr, value in definition_data.items():
                                setattr(definition, attr, value)
                            definition.save()
                        else:
                            Definition.objects.create(vocab=instance, **definition_data) # in theory this should never happen because if we have an id, we should have a definition, but could happen if the definition was deleted in the meantime
                    else:
                        Definition.objects.create(vocab=instance, **definition_data)                     

        # Update translations (you can save processing by not sending translations if they haven't changed)
        if translations_data:
            if not translations_data:
                # If translations_data is empty, delete all existing translations
                instance.translations.all().delete()
            else:
                incoming_translation_ids = [t['id'] for t in translations_data if 'id' in t]
                for translation_data in translations_data:
                    # Look for any translations that are not in the incoming data and delete them
                    for translation in instance.translations.all():
                        if translation.id not in incoming_translation_ids:
                            translation.delete()
                    # Check if the translation already exists (by id) and update it, otherwise create a new one
                    if 'id' in translation_data:
                        translation = Translation.objects.get(id=translation_data['id'], vocab=instance)
                        if translation:
                            for attr, value in translation_data.items():
                                setattr(translation, attr, value)
                            translation.save()
                        else:
                            Translation.objects.create(vocab=instance, **translation_data)
                    else:
                        Translation.objects.create(vocab=instance, **translation_data)

        return instance

    class Meta:
        model = Vocab
        fields = [
            'id',
            'definitions',
            'translations',
            'lemma',
            'lemma_id',
            'chunk',
            'chunk_id',
            'is_lemma',
            'is_chunk',
            'text',
            'vocabClass',
            'tags',
            'source',
            'language',
        ] 



class FunctionTriggerSerializer(serializers.ModelSerializer):
    class Meta:
        model = FunctionTrigger
        fields = '__all__'
        