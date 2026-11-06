import React, { Component } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import api from "../api";

import TagViewer from "./TagViewer";

import '../css/global.css';
import '../css/vocab-viewer.css';

// Wrapper to get URL params and navigate function in class component
function withParams(Component) {
    return props => {
        const params = useParams();
        const navigate = useNavigate();

        return <Component {...props} params={params} navigate={navigate} />;
    };
}

class VocabViewer extends Component {
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
                vocab_class: "",
                vocab_class_id: null,
                language_id: null,
                lemma: null,
                chunk: null
            },
            languages: [],
        };
    }

    componentDidMount() {
        this.fetchVocabData();
        this.fetchLanguageData();
    }

    fetchVocabData = async () => {
        const { params } = this.props;
        const vocabId = params.id;

        try {
            const response = await api.get(`/api/vocabs/${vocabId}/`);
            this.setState({
                vocab: response.data
            });
        } catch (error) {
            console.error("Error fetching vocab data:", error);
        }
        
    };

    fetchLanguageData = async () => {
        try {
            const response = await api.get(`/api/languages/`);
            this.setState({
                languages: response.data
            });
        } catch (error) {
            console.error("Error fetching language data:", error);
        }
    };


    render() {
        const { vocab, languages } = this.state;
        console.log("Rendering VocabViewer with vocab:", vocab);

        return (
            <div className="vocab-viewer frame">
                <h1>{vocab.text}</h1>
                {vocab.is_lemma && vocab.lemma && (
                    
                    <div className="lemma-info">
                        <div className={`lemma-types ${vocab.lemma.types.length > 1 ? '' : 'hidden'}`}>{vocab.lemma.types.filter(type => !type.is_headword).map(type => type.text).join(', ')}</div>
                        {vocab.lemma.headword && vocab.lemma.headword.ipa_text.length > 0 && (
                            <div className="ipa">/{vocab.lemma.headword.ipa_text}/</div>
                        )}
                        <FontAwesomeIcon icon="volume" className="play-button" onClick={() => this.props.playAudio(vocab.lemma.audio_file)} />
                    </div>
                )}
                {vocab.chunk && vocab.chunk && (                    
                    <div className={`chunk-info ${vocab.chunk.chunk_types.length > 1 ? '' : 'hidden'}`}>
                        <div className="chunk-types">({vocab.chunk.chunk_types.filter(type => !type.is_headchunk).map(type => type.text).join(', ')})</div>
                        {vocab.chunk.headchunk && vocab.chunk.headchunk.ipa_text.length > 0 && (
                            <div className="ipa">/{vocab.chunk.headchunk.ipa_text}/</div>
                        )}
                    </div>                    
                )}
                <TagViewer tag_data={vocab.tags} class={{name: vocab.vocab_class, id: vocab.vocab_class_id}}/>               
                { vocab.translations && vocab.translations.length > 0 && (
                    <div className="translations">
                        <h2>Translations</h2>
                        <ul className="translation-list">
                            {vocab.translations.map((translation) => (
                                <li key={translation.id}><div className="language-code">{languages.find((lang) => lang.id === translation.into)?.code || ""}</div> {translation.text}</li>
                            ))}
                        </ul>
                    </div>
                )}
                { vocab.definitions && vocab.definitions.length > 0 && (
                    <div className="definitions">
                        <h2>Definitions</h2>
                        <ul className="definition-list">
                            {vocab.definitions.map((definition) => (
                                <li key={definition.id}>{definition.text}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <h2>Usage</h2>
            </div> 
        )
    }

}

export default withParams(VocabViewer);