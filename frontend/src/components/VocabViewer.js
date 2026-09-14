import React, { Component } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import api from "../api";

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
                {/* Tags here> */}                          
            </div> 
        )
    }

}