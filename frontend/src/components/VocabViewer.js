import React, { Component } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import api from "../api";

import TagViewer from "./TagViewer";

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
            }
        };
    }

    componentDidMount() {
        this.fetchVocabData();
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

    render() {
        const { vocab } = this.state;

        return (
            <div className="vocab-viewer">
                <h1>{vocab.text}</h1>
                <TagViewer tag_data={vocab.tags} class={{name: vocab.vocab_class, id: vocab.vocab_class_id}}/>               
                { vocab.translations && vocab.translations.length > 0 && (
                    <div className="translations">
                        <h2>Translations</h2>
                        <ul>
                            {vocab.translations.map((translation) => (
                                <li key={translation.id}>{translation.text}</li>
                            ))}
                        </ul>
                    </div>
                )}
                { vocab.definitions && vocab.definitions.length > 0 && (
                    <div className="definitions">
                        <h2>Definitions</h2>
                        <ul>
                            {vocab.definitions.map((definition) => (
                                <li key={definition.id}>{definition.text}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div> 
        )
    }

}

export default withParams(VocabViewer);