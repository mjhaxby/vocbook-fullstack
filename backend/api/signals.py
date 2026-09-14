from django.core.exceptions import ValidationError

from .models import Tag

# Last resort to enforce unique tag groups at the model level. This should be handled by the front end.
# Callers must wrap .tags.add() in transaction.atomic(), otherwise a raised ValidationError here poisons the whole outer transaction (Django's internal m2m add() uses atomic(savepoint=False)).
def validate_unique_tag_groups(sender, instance, action, pk_set, **kwargs):
    """Prevent a Vocab from having more than one tag from the same unique TagGroup."""
    if action != 'pre_add' or not pk_set:
        return

    seen_group_ids = set(
        instance.tags.filter(tag_group__unique=True).values_list('tag_group_id', flat=True)
    )
    for tag in Tag.objects.filter(pk__in=pk_set).select_related('tag_group'):
        if tag.tag_group.unique:
            if tag.tag_group_id in seen_group_ids:
                raise ValidationError(
                    f"A vocab can only have one tag from the unique tag group '{tag.tag_group.name}'."
                )
            seen_group_ids.add(tag.tag_group_id)
