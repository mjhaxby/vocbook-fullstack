from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = 'api'

    def ready(self):
        from django.db.models.signals import m2m_changed

        from .models import Vocab
        from .signals import validate_unique_tag_groups

        m2m_changed.connect(validate_unique_tag_groups, sender=Vocab.tags.through)
