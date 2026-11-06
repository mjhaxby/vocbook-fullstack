import React, { useId, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import api from "../api";

class ImportScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            importType: "lemmas"
        };
    }

        // Function to find existing lemma or chunk based on text and class
        // This is duplicated from VocabEditor.js, so it would be better to refactor this into a shared utility function in the future.
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

     readCSVFile = () => {
        const fileInput = document.querySelector('input[type="file"]');
        if (!fileInput.files.length) {
            alert("Please select a CSV file to import.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const csvData = event.target.result;
            // Process the CSV data here
            console.log(csvData);
        };
        const string = reader.readAsText(fileInput.files[0]);
        const array = string.split('\n').map(row => row.split(','));
        let data
        switch(importType) {
            case "lemmas":
                data.map(row => ({
                    headword: row[0],
                    types: row[1].split('/'),
                    word_class: row[2]
                }));
                break;
            case "chunks":
                data.map(row => ({
                    headchunk: row[0],
                    chunk_types: row[1].split('/'),
                    chunk_class: row[2]
                }));
                break;
            case "vocabs":
                data.map(row => ({
                    headword_or_chunk: row[0],
                    types: row[1].split('/'),
                    word_or_chunk_class: row[2],
                    definitions: row[3].split('/'),
                    translations: row[4].split('/')
                }));
                break;
            default:
                console.error("Unknown import type:", importType);
        }
        return data;
    }

    // getOrCreateWordClass = async (wordClassName) => {
    //     try {
    //         const response = await api.get(`/api/word-classes/?name=${wordClassName}&language_id=1`); // to do: make this dynamic based on the selected language
    //         const existingClasses = response.data || [];

    //         if (existingClasses.length > 0) {
    //             return existingClasses[0]; // Return the first matching word class
    //         } else {
    //             // If no existing word class is found, create a new one
    //             const newClassResponse = await api.post('/api/word_classes/', { name: wordClassName, language: 1 }); // to do: make this dynamic based on the selected language
    //             return newClassResponse.data;
    //         }
    //     } catch (error) {
    //         console.error("Error getting or creating word class:", error);
    //         return null;
    //     }
    // }


    importData = async () => {
        console.log(`Importing ${importType}...`);
        const data = this.readCSVFile();
        await data.forEach(item => {
            switch(importType) {§
                case "lemmas":
                    const existingLemma = await this.findExistingVocabElements(item.headword, item.word_class, true);
                    const wordClass = existingLemma ? existingLemma.word_class : {name: item.word_class, language: 1}; // to do: make this dynamic based on the selected language
                    const lemmaData = existingLemma ? { ...existingLemma, types: [...new Set([...existingLemma.types, ...item.types])] } : 
                        { types: [{text: item.headword, is_headword: true}, ...item.types.map(type => ({text: type, is_headword: false}))], word_class: wordClass };                    
                    api.post('/api/lemmas/', lemmaData)
                        .then(response => console.log("Imported lemma:", response.data))
                        .catch(error => console.error("Error importing lemma:", error));
                    break;
                case "chunks":
                    api.post('/api/chunks/', item)
                        .then(response => console.log("Imported chunk:", response.data))
                        .catch(error => console.error("Error importing chunk:", error));
                    break;
                case "vocabs":
                    api.post('/api/vocabs/', item)
                        .then(response => console.log("Imported vocab:", response.data))
                        .catch(error => console.error("Error importing vocab:", error));
                    break;
                default:
                    console.error("Unknown import type:", importType);
            }
        });
    }

    previewData = () => {
        // Implement the logic to preview data based on the selected importType
        console.log(`Previewing ${importType}...`);
        const data = this.readCSVFile();
        console.log("Preview data:", data);
        const previewTable = newElement('table', { className: 'preview-table' },
            newElement('thead', {},
                newElement('tr', {},
                    Object.keys(data[0] || {}).map(key => newElement('th', {}, key))
                )
            ),
            newElement('tbody', {},
                data.map(row => 
                    newElement('tr', {},
                        Object.values(row).map(value => newElement('td', {}, value))
                    )
                )
            )
        );
        const previewContainer = document.getElementById('preview-container');
        previewContainer.innerHTML = '';
        previewContainer.appendChild(previewTable);
    }

    render() {
        const { importType } = this.state;

        return (
        <div className="import-screen">
            <h1>Import</h1>
            <div className="form-group">
                <select name="language" id="language">
                    <option value="en">English</option>
                    <option value="fr">French</option>
                </select>
                <select id="import-type" name="import-type" value={importType} onChange={(e) => this.setState({ importType: e.target.value })}>
                    <option value="lemmas">Lemmas</option>
                    <option value="chunks">Chunks</option>
                    <option value="vocabs">Vocabs</option>
                </select>
            </div>
            {importType == "lemmas" ? (
                <div className="import-lemmas">
                    <p>Import lemmas from a CSV file. The CSV should have the following columns: headword, types (slash-separated), word_class.</p>
                </div>
            ) : importType == "chunks" ? (
                <div className="import-chunks">
                    <p>Import chunks from a CSV file. The CSV should have the following columns: headchunk, chunk_types (slash-separated), chunk_class.</p>
                </div>
            ) : (
                <div className="import-vocabs">
                    <p>Import vocabs from a CSV file. The CSV should have the following columns: headword / headchunk, types (slash-separated), word_class / chunk_class, definitions (slash-separated), translations (slash-separated).</p>
                </div>
            )}
            <input type="file" accept=".csv" />            
            <button className="btn btn-primary" onClick={this.importData}>Import</button>
            <button className="btn btn-secondary" onClick={this.previewData}>Preview</button>
            <div id="preview-container"></div>
        </div>
    )
}

export default ImportScreen;