import React, { Component } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import api from "../api";

// import Switch from "react-switch";

import TranslationEditor from "./TranslationEditor";
import DefinitionEditor from "./DefinitionEditor";
import TagEditor from "./TagEditor";

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
                new_tags: [],
                text: '',
                is_lemma: true,
                is_chunk: false,
                vocab_class: "",
                vocab_class_id: null,
                language_id: null,
            },
            tagLibrary: [],
            classLibrary: [],
        };
    }

    componentDidMount() {
        this.fetchVocabData().then((vocab) => {
            if (vocab && vocab.language_id) {
                this.fetchTagData(vocab.language_id);
                this.fetchClassData(vocab.language_id);
            }
        });
    }

    fetchVocabData = async () => {
        const { params } = this.props;
        const vocabId = params.id;

        if (vocabId === 'new') {
            const defaultVocab = {
                text: '',
                is_lemma: true,
                is_chunk: false,
                translations: [{ text: "", into: 2 }],
                definitions: [{ text: "" }],
                tags: [],
                new_tags: [],
                vocab_class: "",
                vocab_class_id: null,
                lemma: null,
                chunk: null,
                language_id: 1,
            };
            this.setState({
                vocab: defaultVocab,
                tagLibrary: [],
                classLibrary: []
            });
            return defaultVocab;
        } else {
            try {
                const response = await api.get(`/api/vocabs/${vocabId}/`);
                const vocab = { ...this.state.vocab, ...response.data };
                this.setState({ vocab });
                return vocab;
            } catch (error) {
                console.error("Error fetching vocab data:", error);
                return null;
            }
        }
    };

    fetchTagData = async (languageId) => {
        const langId = languageId || this.state.vocab.language_id;
        if (!langId) {
            console.warn("Language ID is not set. Cannot fetch tag data.");
            return;
        }
        try {
            const response = await api.get(`/api/tags/?language_id=${langId}`);
            this.setState({
                tagLibrary: response.data
                    .filter(tag => tag.tag_group && tag.tag_group.vocab_level) // We could potentially include lemma and type levels, BUT we would need to find them again when showing. Depends how we actually end up using these levels. I think for now lemma and type level tags won't be visible at all to normal users, they will just be used in the advanced mode.
                    .map(tag => ({
                        id: `tag-${tag.id}`,
                        rawId: tag.id,
                        text: tag.text,
                        tag_group: tag.tag_group.name,
                        tag_group_id: tag.tag_group.id,
                        tag_group_color: tag.tag_group.color,
                        unique: tag.tag_group.unique,
                        className: `tag tag-group-${tag.tag_group.id} tag-unique-${tag.tag_group.unique}`
                    })),
            });
            console.log('Tag library is:', response.data);
        } catch (error) {
            console.error("Error fetching tag data:", error);
        }
    };

    fetchClassData = async (languageId) => {
        const langId = languageId || this.state.vocab.language_id;
        if (!langId) {
            console.warn("Language ID is not set. Cannot fetch class data.");
            return;
        }
        try {
            const isLemma = this.state.vocab ? this.state.vocab.is_lemma : true;
            const response = await api.get(isLemma ? `/api/word-classes/?language_id=${langId}` : `/api/chunk-classes/?language_id=${langId}`);
            this.setState({
                classLibrary: response.data.map(cls => ({
                    id: `class-${cls.id}`,
                    rawId: cls.id,
                    text: cls.name,
                    className: `class-tag class-tag-${cls.id}`
                }))
            });
            console.log("Fetched class data:", response.data);
        } catch (error) {
            console.error("Error fetching class data:", error);
        }
    };

    handleInputChange = (event) => {
        const { name, value } = event.target;

        if (name === "tags") {
            const tagsArray = value.split('#').map(tag => tag.trim()).filter(tag => tag !== '');
            this.setState({ vocab: { ...this.state.vocab, tags: tagsArray } });
        } else {
            this.setState({ vocab: { ...this.state.vocab, [name]: value } });
        }

        // when typing in the vocab text input, check if it contains spaces to determine if it's a lemma or chunk
        if (name === "text") {
            const isLemma = !value.trim().match(/\s/);
            const wasLemma = this.state.vocab.is_lemma;
            this.setState(
                { vocab: { ...this.state.vocab, text: value, is_lemma: isLemma, is_chunk: !isLemma } },
                () => {
                    if (isLemma !== wasLemma) {
                        this.fetchClassData();
                    }
                }
            );
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

    saveChanges = async (continueEditing = false) => {
        let { vocab } = this.state;
        const vocabId = this.props.params.id;

        // to do: speed up processing by checking for changes, and only sending changed data to the backend (especially for translations and definitions)

        // to do: add new tags to the backend if they don't exist yet, and then add their IDs to the vocab's tags array before saving the vocab.
        // new tags have id in style of tag-<tag_text>

        try {
            if (vocabId === 'new') {
                await this.findExistingVocabElements(vocab.text, vocab.vocab_class, vocab.is_lemma).then(existingVocab => {
                    // TO DO: add language above!!!
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
                            api.post('/api/lemmas/', { text: vocab.text, word_class: vocab.vocab_class, language_id: vocab.language_id }).then(response => {
                                const newLemmaId = response.data.id;
                                vocab.lemma = newLemmaId;
                            });
                        } else {
                            api.post('/api/chunks/', { text: vocab.text, chunk_class: vocab.vocab_class, language_id: vocab.language_id }).then(response => {
                                const newChunkId = response.data.id;
                                vocab.chunk = newChunkId;
                            });
                        }
                    }
                    api.post('/api/vocabs/', vocab);
                    if (continueEditing) {
                        this.props.navigate(`/vocabs/${vocab.id}`); // Navigate to the newly created vocab's page
                    } else {
                        this.props.navigate('/vocabs'); // Navigate back to the vocab list
                    }
                });
            } else {
                // to do: change/update lemma/chunk? maybe decide to update the lemma if this is the only vocab using it?
                // to do: react to changes from lemma to chunk and vice versa – will need to discard the old lemma/chunk if it is no longer used by any vocabs, or otherwise just disconect, and create a new one if necessary.
                await api.put(`/api/vocabs/${vocabId}/`, vocab);
                if (!continueEditing) {
                    this.props.navigate('/vocabs'); // Navigate back to the vocab list
                }
            }
        } catch (error) {
            console.error("Error saving vocab data:", error);
        }
    }

    tags = (tags) => {
        return (
            <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <TagEditor
                    tag_ids={tags}
                    class_ids={this.state.vocab.vocab_class_id !== null ? [this.state.vocab.vocab_class_id] : []}
                    new_tags={this.state.vocab.new_tags}
                    tagLibrary={this.state.tagLibrary}
                    classLibrary={this.state.classLibrary}
                    tagLevel="vocab_level"
                    vocabForm={this.state.vocab.is_lemma ? "lemma" : "chunk"}
                    vocabClassID={this.state.vocab.vocab_class_id}
                    handleDelete={(i) => {
                        // Tags should be in order: class tags, existing tags (tags already in the database), new tags (not added to the database yet)
                        const class_id_length = this.state.vocab.vocab_class_id !== null ? 1 : 0;
                        if (i === 0 && this.state.vocab.vocab_class_id !== null) {
                            // If the index is 0 and we have a class ID, it means we're deleting that                            
                            this.setState({ vocab: { ...this.state.vocab, vocab_class_id: null } });
                        } else if (i < class_id_length + this.state.vocab.tags.length) {
                            // if it's beyond the class range, it means we're deleting an existing tag
                            const tagIndex = i - class_id_length;
                            const updatedTags = this.state.vocab.tags.filter((tagId, index) => index !== tagIndex);
                            this.setState({ vocab: { ...this.state.vocab, tags: updatedTags } });
                        } else {
                            // if it's beyond the class and existing tag range, it means we're deleting a new tag
                            const newTagIndex = i - class_id_length - this.state.vocab.tags.length;
                            const updatedNewTags = this.state.vocab.new_tags.filter((tag, index) => index !== newTagIndex);
                            this.setState({ vocab: { ...this.state.vocab, new_tags: updatedNewTags } });
                        }
                    }}
                    handleAddition={(tag) => {
                        console.log("Adding tag:", tag);
                        const tagTextLower = tag.text.trim().toLowerCase();

                        // Check if the tag matches an existing class in classLibrary
                        const matchingClass = this.state.classLibrary.find(
                            cls => cls.text.trim().toLowerCase() === tagTextLower
                        );

                        if (matchingClass) {
                            console.log("Found existing class in classLibrary:", matchingClass);
                            const classId = matchingClass.rawId || parseInt(matchingClass.id.replace('class-', ''), 10);
                            this.setState({
                                vocab: { ...this.state.vocab, vocab_class_id: classId }
                            });
                            return;
                        }

                        // Check if the tag matches an existing tag in tagLibrary
                        const matchingTag = this.state.tagLibrary.find(
                            t => t.text.trim().toLowerCase() === tagTextLower
                        );

                        if (matchingTag) {
                            console.log("Found existing tag in tagLibrary:", matchingTag);
                            const tagId = matchingTag.rawId || parseInt(matchingTag.id.replace('tag-', ''), 10);
                            if (!tags.includes(tagId)) {
                                const updatedTags = [...tags, tagId];
                                this.setState({
                                    vocab: { ...this.state.vocab, tags: updatedTags }
                                });
                            }
                            return;
                        }

                        console.log("No existing tag or class found in library, creating new tag:", tag);
                        this.setState({
                            vocab: { ...this.state.vocab, new_tags: [...this.state.vocab.new_tags, tag] }
                        });
                    }}
                    handleDrag={(tag, currPos, newPos) => {
                        // Remove? Not planning on allowing reordering of tags…
                        const newTags = [...tags];
                        newTags.splice(currPos, 1);
                        newTags.splice(newPos, 0, tag.id);
                        this.setState({ vocab: { ...this.state.vocab, tags: newTags } });
                    }}
                />
            </div>
        );

    }

    translationLine = (translation, index) => {
        return (
            <div className="editor-line" key={index}>
                <TranslationEditor
                    key={index}
                    translation={translation}
                    onChange={(updatedTranslation) => {
                        const updatedTranslations = [...this.state.vocab.translations];
                        updatedTranslations[index] = updatedTranslation;
                        this.setState({ vocab: { ...this.state.vocab, translations: updatedTranslations } });
                    }}
                />
                {index === this.state.vocab.translations.length - 1 && (
                    <button type="button" className="btn btn-secondary  btn-icon" alt="Add Translation" onClick={() => {
                        const newTranslation = { text: "", into: 2 }; // to do: replace 2 with users preferred language
                        this.setState({ vocab: { ...this.state.vocab, translations: [...this.state.vocab.translations, newTranslation] } });
                    }}>
                        <FontAwesomeIcon icon="plus" />
                    </button>
                )}
            </div>
        );
    }

    defintionLine = (definition, index) => {
        return (
            <div className="editor-line" key={index}>
                <DefinitionEditor
                    key={index}
                    definition={definition}
                    onChange={(updatedDefinition) => {
                        const updatedDefinitions = [...this.state.vocab.definitions];
                        updatedDefinitions[index] = updatedDefinition;
                        this.setState({ vocab: { ...this.state.vocab, definitions: updatedDefinitions } });
                    }}
                />
                {index === this.state.vocab.definitions.length - 1 && (
                    <button type="button" className="btn btn-secondary btn-icon" alt="Add Definition" onClick={() => {
                        const newDefinition = { text: "" };
                        this.setState({ vocab: { ...this.state.vocab, definitions: [...this.state.vocab.definitions, newDefinition] } });
                    }}>
                        <FontAwesomeIcon icon="plus" />
                    </button>
                )}
            </div>
        );
    }

    render() {
        const { vocab } = this.state;

        return (
            <div className="form-container editor-container">
                <div className="form-group">
                    <label htmlFor="text" className={`vocab-type ${vocab.is_lemma ? 'lemma' : 'chunk'}`}><span id="vocabType">{vocab.is_lemma ? 'Word' : 'Expression'}</span> • <span id="notVocabType">{vocab.is_lemma ? 'Expression' : 'Word'}</span> </label>
                    <input
                        type="text"
                        className="form-control vocab-text-input"
                        id="text"
                        name="text"
                        value={vocab.text || ''}
                        placeholder={'Enter a word or expression'}
                        onChange={this.handleInputChange}
                    />

                    <div >
                        {this.tags(vocab.tags)}
                    </div>
                </div>

                <div className="form-group">
                    <h2>Translations</h2>
                    {vocab.translations && vocab.translations.map((translation, index) => (
                        this.translationLine(translation, index)
                    ))}
                </div>

                <div className="form-group">
                    <h2>Definitions</h2>
                    {vocab.definitions && vocab.definitions.map((definition, index) => (
                        this.defintionLine(definition, index)
                    ))}
                </div>
                <div className="btn-group">
                    <button type="submit" className="btn btn-primary" onClick={this.saveChanges.bind(this, true)}>Save Changes and Continue Editing</button>
                    <button type="submit" className="btn btn-secondary" onClick={this.saveChanges.bind(this, false)}>Save Changes and Close</button>
                    <button type="button" className="btn btn-danger" onClick={() => this.props.navigate('/vocabs')}>Cancel</button>
                </div>
            </div>
        );
    }
}

export default withParams(VocabEditor);