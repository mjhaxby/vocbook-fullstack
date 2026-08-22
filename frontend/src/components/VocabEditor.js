import React, { Component } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

import Switch from "react-switch";

import TranslationEditor from "./TranslationEditor";
import DefinitionEditor from "./DefinitionEditor";

// Wrapper to get URL params and navigate function in class component
function withParams(Component) {
    return props => {
        const params = useParams();
        const navigate = useNavigate();

        return <Component {...props} params={params} navigate={navigate} />;
    };
}

class VocabEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            vocab: props.vocab || {
                translations: [],
                definitions: [],
                tags: [],
                text: '',
                is_lemma: true,
                is_chunk: false,
            }
        };
    }

    componentDidMount() {
        this.fetchVocabData();
    }

    fetchVocabData = async () => {
        const { params } = this.props;
        const vocabId = params.id;

        if (vocabId == 'new') {
            this.setState({
                vocab: {
                    text: '',
                    is_lemma: true,
                    is_chunk: false,
                    translations: [],
                    definitions: [],
                    tags: [],
                    vocab_class: null,
                    lemma: null,
                    chunk: null
                }
            });
        } else {
            try {
                const response = await api.get(`/api/vocabs/${vocabId}/`);
                this.setState({
                    vocab: response.data
                });
            } catch (error) {
                console.error("Error fetching vocab data:", error);
            }
        }
    };


    handleInputChange = (event) => {
        const { name, value } = event.target;
        this.props.onChange({ ...this.props.vocab, [name]: value });

        if (event.target.name === "text") {
            let value = event.target.value;
            if (value.match(/\s/)) {
                this.props.onChange({ ...this.props.vocab, is_lemma: false, is_chunk: true });
                // to do: extract function triggers first
            } else {
                this.props.onChange({ ...this.props.vocab, is_lemma: true, is_chunk: false });
            }
        }
    };

    // Function to find existing lemma or chunk based on text and class
    findExistingVocabElements = async (text, vocabClass = "", isLemma = true) => {
        const endpoint = isLemma ? "lemmas" : "chunks";
        const classKey = isLemma ? "word_class" : "chunk_class";

        try {
            const response = await api.get(`/api/${endpoint}/?text=${text}`); // to do: configure the backend to search for all types (in a lemma) and variations (in a chunk)
            const matches = response.data || [];

            // If no existing lemma or chunk is found, return null
            // to do: maybe be worth doing some checks for similarity in case of spelling mistakes, or if the user has made a typo. 
            if (matches.length === 0) {
                return null;
            }

            // If exactly one match is found, return it
            if (matches.length === 1) {
                return matches[0];
            }

            // If multiple matches are found, filter by the specified class (if provided)
            const matchesOfClass = matches.filter(item => item[classKey] === vocabClass);
            if (matchesOfClass.length === 1) {
                return matchesOfClass[0];
            }

            // To do: Better handling in this last situation! Probably want to include a function as a parameter for this function to handle. 
            // Depending on the exact situation, we might prompt for a class (if none was specified) or we might make a new lemma/chunk
            return null;
        } catch (error) {
            console.error(`Error finding existing ${isLemma ? "lemma" : "chunk"}:`, error);
            return null;
        }
    }

    saveChanges = async () => {
        const { vocab } = this.state;
        const vocabId = this.props.params.id;

        // to do: speed up processing by checking for changes, and only sending changed data to the backend (especially for translations and definitions)

        try {
            if (vocabId === 'new') {
                await this.findExistingVocabElements(vocab.text, vocab.vocab_class, vocab.is_lemma).then(existingVocab => {
                    if (existingVocab) {
                        // If an existing lemma or chunk is found, update the vocab with its ID
                        const updatedVocab = { ...vocab };
                        if (vocab.is_lemma) {
                            updatedVocab.lemma = existingVocab.id;
                        } else {
                            updatedVocab.chunk = existingVocab.id;
                        }
                        vocab = updatedVocab;
                    } else {
                        // If no existing lemma or chunk is found, create a new one
                        if (vocab.is_lemma) {
                            api.post('/api/lemmas/', { text: vocab.text, word_class: vocab.vocab_class }).then(response => {
                                const newLemmaId = response.data.id;
                                vocab.lemma = newLemmaId;
                            });
                        } else {
                            api.post('/api/chunks/', { text: vocab.text, chunk_class: vocab.vocab_class }).then(response => {
                                const newChunkId = response.data.id;
                                vocab.chunk = newChunkId;
                            });
                        }
                    }
                    api.post('/api/vocabs/', vocab);
                    this.props.navigate(`/vocabs/${vocab.id}`); // Navigate to the newly created vocab's page
                });
            } else {
                // to do: change/update lemma/chunk? maybe decide to update the lemma if this is the only vocab using it?
                // to do: react to changes from lemma to chunk and vice versa – will need to discard the old lemma/chunk if it is no longer used by any vocabs, or otherwise just disconect, and create a new one if necessary.
                await api.put(`/api/vocabs/${vocabId}/`, vocab);
            }            
        } catch (error) {
            console.error("Error saving vocab data:", error);
        }
    }

    render() {
        const { vocab } = this.state;

        return (
            <div>
                <div className="form-group">
                    <label htmlFor="text">Vocabulary Item</label>
                    <input
                        type="text"
                        className="form-control"
                        id="text"
                        name="text"
                        value={vocab.text || ''}
                        onChange={this.handleInputChange}
                    />

                    <div>
                        <label ClassName={`switch-label ${vocab.is_lemma ? 'lemma' : 'chunk'}`}>
                            <span>Expression</span>
                            <Switch onChange={(checked) => {
                                this.setState({ vocab: { ...vocab, is_lemma: checked, is_chunk: !checked } });
                            }} checked={vocab.is_lemma} />
                            <span>Word</span>
                        </label>
                    </div>
                </div>

                <div>
                    <h2>Translations</h2>
                    {vocab.translations && vocab.translations.map((translation, index) => (
                        <TranslationEditor
                            key={index}
                            translation={translation}
                            onChange={(updatedTranslation) => {
                                const updatedTranslations = [...vocab.translations];
                                updatedTranslations[index] = updatedTranslation;
                                this.setState({ vocab: { ...vocab, translations: updatedTranslations } });                                
                            }}
                        />
                    ))}
                </div>

                <div>
                    <h2>Definitions</h2>
                    {vocab.definitions && vocab.definitions.map((definition, index) => (
                        <DefinitionEditor
                            key={index}
                            definition={definition}
                            onChange={(updatedDefinition) => {
                                const updatedDefinitions = [...vocab.definitions];
                                updatedDefinitions[index] = updatedDefinition;
                                this.setState({ vocab: { ...vocab, definitions: updatedDefinitions } });
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    }
}

export default withParams(VocabEditor);