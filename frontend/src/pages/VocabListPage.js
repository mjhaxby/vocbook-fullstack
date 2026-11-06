import React, { Component } from "react";
import api from "../api";

import VocabList from "../components/VocabList";

class VocabListPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            vocabs: [],
            loading: true,
            error: null
        };
    }

    componentDidMount(){
        this.fetchVocabData();
    }

    fetchVocabData = async () => {
        try {
            const [vocabs] = await Promise.all(
                [api.get(`/api/vocabs/`)]
            )

            this.setState({
                vocabs: vocabs.data,
                loading: false
            })

        } catch (error) {
            this.setState({
                error: "Failed to load vocab data",
                loading: false
            });
            console.error("Error fetching vocab data:", error)
        }

    } 

    render(){
        return (
            <div>
                <h1>Browse</h1>
                {this.state.loading && <p>Loading...</p>}
                {this.state.error && <p className="text-danger">{this.state.error}</p>}
                {this.state.vocabs.length === 0 && !this.state.loading && !this.state.error && (
                    <p className="text-muted">No vocabulary yet.</p>
                )}
                {this.state.vocabs.length > 0 && !this.state.loading && !this.state.error && (
                    <VocabList vocabs={this.state.vocabs} />
                )}
            </div>
        )
    }

} 

export default VocabListPage;