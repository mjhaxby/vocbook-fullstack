import React, { Component } from "react";

import TagLibraryEditor from "../components/TagLibraryEditor";

class TagLibraryPage extends Component {
    constructor(props) {
        super(props);
    }

    render(){
        return (
            <div>
                <h1>Tag Library</h1>
                <TagLibraryEditor />
            </div>
        )
    }

} 

export default TagLibraryPage;