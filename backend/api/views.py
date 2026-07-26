from django.shortcuts import render
from rest_framework import viewsets
from .models import IPA, Language, WordClass, ChunkClass, Lemma, Type, Chunk, TagType, Tag, Vocab, Relationship, Translation, Definition, FunctionTrigger
from .serializers import IPA_Serializer, LanguageSerializer, WordClassSerializer, ChunkClassSerializer, LemmaSerializer, TypeSerializer, ChunkSerializer, TagTypeSerializer, TagSerializer, VocabSerializer, RelationshipSerializer, TranslationSerializer, DefinitionSerializer, FunctionTriggerSerializer    

# Create your views here.
class LanguageViewSet(viewsets.ModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer


class WordClassViewSet(viewsets.ModelViewSet):
    queryset = WordClass.objects.all()
    serializer_class = WordClassSerializer


class ChunkClassViewSet(viewsets.ModelViewSet):
    queryset = ChunkClass.objects.all()
    serializer_class = ChunkClassSerializer

class IPAViewSet(viewsets.ModelViewSet):
    queryset = IPA.objects.all()
    serializer_class = IPA_Serializer

class LemmaViewSet(viewsets.ModelViewSet):
    queryset = Lemma.objects.all()
    serializer_class = LemmaSerializer


class TypeViewSet(viewsets.ModelViewSet):
    queryset = Type.objects.all()
    serializer_class = TypeSerializer


class ChunkViewSet(viewsets.ModelViewSet):
    queryset = Chunk.objects.all()
    serializer_class = ChunkSerializer


class TagTypeViewSet(viewsets.ModelViewSet):
    queryset = TagType.objects.all()
    serializer_class = TagTypeSerializer


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer


class VocabViewSet(viewsets.ModelViewSet):
    queryset = Vocab.objects.all()
    serializer_class = VocabSerializer


class RelationshipViewSet(viewsets.ModelViewSet):
    queryset = Relationship.objects.all()
    serializer_class = RelationshipSerializer


class TranslationViewSet(viewsets.ModelViewSet):
    queryset = Translation.objects.all()
    serializer_class = TranslationSerializer


class DefinitionViewSet(viewsets.ModelViewSet):
    queryset = Definition.objects.all()
    serializer_class = DefinitionSerializer


class FunctionTriggerViewSet(viewsets.ModelViewSet):
    queryset = FunctionTrigger.objects.all()
    serializer_class = FunctionTriggerSerializer

