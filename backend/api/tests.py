from rest_framework.test import APITestCase

from .models import Definition, Language, Lemma, Translation, Type, Vocab, WordClass


class LemmaCreationTests(APITestCase):
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
				'language': self.english.pk,
				'lemma': self.lemma.pk,
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


