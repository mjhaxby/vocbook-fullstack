from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ChunkClassViewSet,
    ChunkViewSet,
    DefinitionViewSet,
    FunctionTriggerViewSet,
    IPAViewSet,
    LanguageViewSet,
    LemmaViewSet,
    RelationshipViewSet,
    TagGroupViewSet,
    TagViewSet,
    TranslationViewSet,
    TypeViewSet,
    VocabViewSet,
    WordClassViewSet,
    csrf_view
)

router = DefaultRouter()
router.register(r'languages', LanguageViewSet)
router.register(r'word-classes', WordClassViewSet)
router.register(r'chunk-classes', ChunkClassViewSet)
router.register(r'ipas', IPAViewSet)
router.register(r'lemmas', LemmaViewSet)
router.register(r'types', TypeViewSet)
router.register(r'chunks', ChunkViewSet)
router.register(r'tag-types', TagGroupViewSet)
router.register(r'tags', TagViewSet)
router.register(r'vocabs', VocabViewSet)
router.register(r'relationships', RelationshipViewSet)
router.register(r'translations', TranslationViewSet)
router.register(r'definitions', DefinitionViewSet)
router.register(r'function-triggers', FunctionTriggerViewSet)

urlpatterns = router.urls + [
    path('csrf/', csrf_view, name='csrf'),
]