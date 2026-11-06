from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework.test import APITestCase

from .models import Definition, IPA, Language, Lemma, Tag, TagGroup, Translation, Type, Vocab, WordClass
from .serializers import TagSerializer


class LemmaCreationTests(APITestCase):
	def test_create_from_headword_text_and_return_headword_object(self):
		english = Language.objects.create(code='en', name='English')
		noun = WordClass.objects.create(name='noun')
		noun.languages.add(english)
		response = self.client.post('/api/lemmas/', {
			'language': english.pk,
			'word_class_name': 'noun',
			'headword_text': 'banana',
			'types_input': [{'text': 'bananas', 'is_headword': False}],
		}, format='json')

		self.assertEqual(response.status_code, 201, response.data)
		lemma = Lemma.objects.get(pk=response.data['id'])
		self.assertEqual(lemma.word_class, noun)
		self.assertEqual(lemma.headword_text, 'banana')
		headword = lemma.types.get(is_headword=True)
		self.assertEqual(headword.language, english)
		self.assertEqual(response.data['headword']['id'], headword.pk)
		self.assertEqual(response.data['headword']['text'], 'banana')
		self.assertEqual(lemma.types.count(), 2)

	def test_create_from_headword_type_creates_word_class(self):
		english = Language.objects.create(code='en', name='English')
		response = self.client.post('/api/lemmas/', {
			'language': english.pk,
			'word_class_name': 'noun',
			'types_input': [{'text': 'banana', 'is_headword': True}],
		}, format='json')

		self.assertEqual(response.status_code, 201, response.data)
		lemma = Lemma.objects.get(pk=response.data['id'])
		self.assertEqual(lemma.headword_text, 'banana')
		self.assertEqual(lemma.word_class.name, 'noun')
		self.assertTrue(lemma.word_class.languages.filter(pk=english.pk).exists())
		self.assertEqual(response.data['headword']['text'], 'banana')

	def test_create_with_only_headword_text(self):
		english = Language.objects.create(code='en', name='English')
		response = self.client.post('/api/lemmas/', {
			'language': english.pk, 'word_class_name': 'noun', 'headword_text': 'banana',
		}, format='json')
		self.assertEqual(response.status_code, 201, response.data)
		lemma = Lemma.objects.get(pk=response.data['id'])
		self.assertEqual(lemma.types.count(), 1)
		self.assertEqual(lemma.types.get().text, 'banana')
		self.assertTrue(lemma.types.get().is_headword)

	def test_matching_headword_text_and_type_create_one_headword(self):
		english = Language.objects.create(code='en', name='English')
		response = self.client.post('/api/lemmas/', {
			'language': english.pk,
			'word_class_name': 'noun',
			'headword_text': 'banana',
			'types_input': [{'text': 'banana', 'is_headword': True}],
		}, format='json')
		self.assertEqual(response.status_code, 201, response.data)
		self.assertEqual(Lemma.objects.get(pk=response.data['id']).types.count(), 1)

	def test_get_returns_full_headword_object(self):
		english = Language.objects.create(code='en', name='English')
		lemma = Lemma.objects.create(language=english, headword_text='banana')
		ipa = IPA.objects.create(language=english, text='bəˈnɑːnə')
		headword = Type.objects.create(
			language=english, lemma=lemma, text='banana', is_headword=True, ipa=ipa,
		)
		response = self.client.get(f'/api/lemmas/{lemma.pk}/')
		self.assertEqual(response.status_code, 200, response.data)
		self.assertEqual(response.data['headword']['id'], headword.pk)
		self.assertEqual(response.data['headword']['ipa_text'], ipa.text)
		self.assertEqual(response.data['headword']['lemma'], lemma.pk)
		self.assertEqual(response.data['headword']['tags'], [])

	def test_invalid_headword_inputs_are_rejected(self):
		english = Language.objects.create(code='en', name='English')
		base = {'language': english.pk, 'word_class_name': 'noun'}
		cases = [
			{},
			{'headword_text': 'banana', 'types_input': [{'text': 'apple', 'is_headword': True}]},
			{'types_input': [
				{'text': 'banana', 'is_headword': True},
				{'text': 'apple', 'is_headword': True},
			]},
		]
		for case in cases:
			with self.subTest(case=case):
				response = self.client.post('/api/lemmas/', {**base, **case}, format='json')
				self.assertEqual(response.status_code, 400, response.data)
		self.assertFalse(Lemma.objects.exists())
		self.assertFalse(WordClass.objects.exists())

	def test_headword_updates_are_explicitly_rejected(self):
		english = Language.objects.create(code='en', name='English')
		lemma = Lemma.objects.create(language=english, headword_text='banana')
		Type.objects.create(language=english, lemma=lemma, text='banana', is_headword=True)
		for data in (
			{'headword_text': 'apple'},
			{'types_input': [{'text': 'apple', 'is_headword': True}]},
			{'word_class_name': 'noun'},
		):
			with self.subTest(data=data):
				response = self.client.patch(f'/api/lemmas/{lemma.pk}/', data, format='json')
				self.assertEqual(response.status_code, 400, response.data)
		lemma.refresh_from_db()
		self.assertEqual(lemma.headword_text, 'banana')
		self.assertEqual(lemma.types.get(is_headword=True).text, 'banana')
		response = self.client.patch(f'/api/lemmas/{lemma.pk}/', {'source': 'dictionary'}, format='json')
		self.assertEqual(response.status_code, 200, response.data)
		self.assertEqual(response.data['source'], 'dictionary')

	def test_create_lemma_with_headword_type(self):
		english = Language.objects.create(code='en', name='English')
		noun = WordClass.objects.create(name='noun')
		noun.languages.add(english)

		lemma = Lemma.objects.create(
			language=english,
			word_class=noun,
			headword_text='banana',
		)

		headword = Type.objects.create(
			language=english,
			lemma=lemma,
			text='banana',
			is_headword=True,
		)

		self.assertEqual(lemma.headword_text, 'banana')
		self.assertEqual(lemma.language, english)
		self.assertEqual(lemma.word_class, noun)
		self.assertEqual(lemma.types.get(), headword)


class VocabCreationTests(APITestCase):
	def setUp(self):
		self.english = Language.objects.create(code='en', name='English')
		self.french = Language.objects.create(code='fr', name='French')
		self.noun = WordClass.objects.create(name='noun')
		self.noun.languages.add(self.english)
		self.lemma = Lemma.objects.create(
			language=self.english,
			word_class=self.noun,
			headword_text='banana',
		)
		self.headword = Type.objects.create(
			language=self.english,
			lemma=self.lemma,
			text='banana',
			is_headword=True,
		)

	def test_create_vocab_with_existing_lemma(self):
		response = self.client.post(
			'/api/vocabs/',
			{
				'language_id': self.english.pk,
				'lemma_id': self.lemma.pk,
				'definitions': [
					{'text': 'banana'},
				],
				'translations': [
					{
						'into': self.french.pk,
						'text': 'banane',
					},
				],
			},
			format='json',
		)

		self.assertEqual(response.status_code, 201)
		vocab = Vocab.objects.get(pk=response.data['id'])
		self.assertEqual(vocab.lemma, self.lemma)
		self.assertEqual(Lemma.objects.count(), 1)
		self.assertEqual(vocab.definitions.get().text, 'banana')
		self.assertEqual(vocab.translations.get().text, 'banane')
		self.assertEqual(vocab.translations.get().into, self.french)


class TagGroupConstraintTests(APITestCase):
	def setUp(self):
		self.english = Language.objects.create(code='en', name='English')
		self.noun = WordClass.objects.create(name='noun')
		self.noun.languages.add(self.english)
		self.lemma = Lemma.objects.create(
			language=self.english,
			word_class=self.noun,
			headword_text='banana',
		)
		self.vocab = Vocab.objects.create(language=self.english, lemma=self.lemma)
		self.register_group = TagGroup.objects.create(name='register', unique=True)

	def test_vocab_cannot_have_two_tags_from_unique_tag_group(self):
		formal = Tag.objects.create(tag_group=self.register_group, text='formal')
		formal.languages.add(self.english)
		informal = Tag.objects.create(tag_group=self.register_group, text='informal')
		informal.languages.add(self.english)

		self.vocab.tags.add(formal)
		# nested atomic() gives the failed add its own savepoint, so the outer test transaction survives
		with self.assertRaises(ValidationError), transaction.atomic():
			self.vocab.tags.add(informal)

		self.assertEqual(list(self.vocab.tags.all()), [formal])

	def test_vocab_can_have_tags_from_different_unique_tag_groups(self):
		formal = Tag.objects.create(tag_group=self.register_group, text='formal')
		formal.languages.add(self.english)
		part_of_speech_group = TagGroup.objects.create(name='part of speech', unique=True)
		countable = Tag.objects.create(tag_group=part_of_speech_group, text='countable')
		countable.languages.add(self.english)

		self.vocab.tags.add(formal, countable)

		self.assertCountEqual(self.vocab.tags.all(), [formal, countable])


class TagCreationTests(APITestCase):
	def setUp(self):
		self.english = Language.objects.create(code='en', name='English')
		self.french = Language.objects.create(code='fr', name='French')

	def test_tag_without_tag_group_uses_generic_tag_group(self):
		serializer = TagSerializer(data={
			'text': 'slang',
			'languages_id': [self.english.pk],
		})
		serializer.is_valid(raise_exception=True)
		tag = serializer.save()

		self.assertEqual(tag.tag_group.name, 'generic')

	def test_reusing_generic_tag_group_does_not_create_duplicates(self):
		serializer_one = TagSerializer(data={
			'text': 'first',
			'languages_id': [self.english.pk],
		})
		serializer_one.is_valid(raise_exception=True)
		serializer_one.save()

		serializer_two = TagSerializer(data={
			'text': 'second',
			'languages_id': [self.english.pk],
		})
		serializer_two.is_valid(raise_exception=True)
		serializer_two.save()

		self.assertEqual(TagGroup.objects.filter(name='generic').count(), 1)

	def test_creating_tag_with_existing_text_adds_language_instead_of_duplicating(self):
		first = TagSerializer(data={'text': 'slang', 'languages_id': [self.english.pk]})
		first.is_valid(raise_exception=True)
		first.save()

		second = TagSerializer(data={'text': 'slang', 'languages_id': [self.french.pk]})
		second.is_valid(raise_exception=True)
		tag = second.save()

		self.assertEqual(Tag.objects.filter(text='slang').count(), 1)
		self.assertCountEqual(tag.languages.all(), [self.english, self.french])
