from django.shortcuts import render
from rest_framework import viewsets
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from .models import IPA, Language, WordClass, ChunkClass, Lemma, Type, Chunk, TagGroup, Tag, Vocab, Relationship, Translation, Definition, FunctionTrigger
from .serializers import IPA_Serializer, LanguageSerializer, WordClassSerializer, ChunkClassSerializer, LemmaSerializer, TypeSerializer, ChunkSerializer, TagGroupSerializer, TagSerializer, VocabSerializer, RelationshipSerializer, TranslationSerializer, DefinitionSerializer, FunctionTriggerSerializer    

@ensure_csrf_cookie
def csrf_view(request):
    return JsonResponse({'detail': 'CSRF cookie set'})

# Create your views here.
class LanguageViewSet(viewsets.ModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer


class WordClassViewSet(viewsets.ModelViewSet):
    queryset = WordClass.objects.all()
    serializer_class = WordClassSerializer

    def get_queryset(self):
            queryset = WordClass.objects.all()
            name = self.request.query_params.get('name')
            language_id = self.request.query_params.get('language_id')
    
            if name or language_id:
                # a search was attempted — require both, or return nothing
                if name and language_id:
                    queryset = queryset.filter(name=name, languages__id=language_id)
                elif language_id:
                    queryset = queryset.filter(languages__id=language_id)
                else:
                    queryset = queryset.none()
            # else: no search params at all → return full unfiltered list
    
            return queryset

class ChunkClassViewSet(viewsets.ModelViewSet):
    queryset = ChunkClass.objects.all()
    serializer_class = ChunkClassSerializer

    def get_queryset(self):
        queryset = ChunkClass.objects.all()
        name = self.request.query_params.get('name')
        language_id = self.request.query_params.get('language_id')

        if name or language_id:
            # a search was attempted — require both, or return nothing
            if name and language_id:
                queryset = queryset.filter(name=name, languages__id=language_id)
            elif language_id:
                queryset = queryset.filter(languages__id=language_id)
            else:
                queryset = queryset.none()
        # else: no search params at all → return full unfiltered list

        return queryset

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


class TagGroupViewSet(viewsets.ModelViewSet):
    queryset = TagGroup.objects.all()
    serializer_class = TagGroupSerializer


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

    def get_queryset(self):
        queryset = Tag.objects.all()
        text = self.request.query_params.get('text')
        language_id = self.request.query_params.get('language_id')

        if text or language_id:
            # a search was attempted — require both, or return nothing
            if text and language_id:
                queryset = queryset.filter(text=text, languages__id=language_id)
            elif language_id:
                queryset = queryset.filter(languages__id=language_id)
            else:
                queryset = queryset.none()
        # else: no search params at all → return full unfiltered list

        return queryset

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

