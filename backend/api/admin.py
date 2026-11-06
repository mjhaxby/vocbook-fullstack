from django.contrib import admin
from .models import IPA, ChunkType, Language, TagGroup, WordClass, ChunkClass, Lemma, Type, Chunk, TagGroup, Tag, Vocab, Relationship, Translation, Definition, FunctionTrigger

# Register your models here.
admin.site.register(Language)
admin.site.register(WordClass)
admin.site.register(ChunkClass)
admin.site.register(IPA)
admin.site.register(Lemma)
admin.site.register(Type)
admin.site.register(Chunk)
admin.site.register(ChunkType)
admin.site.register(TagGroup)
admin.site.register(Tag)
admin.site.register(Vocab)
admin.site.register(Relationship)
admin.site.register(Translation)
admin.site.register(Definition)
admin.site.register(FunctionTrigger)
