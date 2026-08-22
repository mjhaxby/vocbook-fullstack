import React, { Component } from "react";
// import api from "../api";

class HomePage extends Component {

    render() {
        return (
            <div>
                <h1>Welcome to VocBook</h1>
                <p>This is the home page of the VocBook application.</p>
                <a href="/vocabs">Go to Vocab List</a>
            </div>
        );
    }
}

export default HomePage;