import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function VocabList({ vocabs }){
    const navigate = useNavigate;

    if (!vocabs || vocabs.length === 0){
        return <p className="text-muted">No vocabulary yet.</p>
    }

    return (
        <ul className="list-group">
            {vocabs.map(vocab => {
                return (<li key={vocab.id} className="list-group-item">
                        {vocab.is_lemma && (
                        <>
                            <h3>{vocab.lemma.headword.text}</h3>
                            <p style={{ fontSize: '0.9em' }}>({vocab.lemma.types.filter(type => !type.is_headword).map(type => type.text).join(', ')})</p>
                            <p><i>{vocab.lemma.word_class.name}</i> /{vocab.lemma.headword.ipa_text}/</p>
                        </>
                        )}
                        {vocab.is_chunk && (
                        <>
                            <h3>{vocab.chunk.text}</h3>
                            <p><i>{vocab.chunk.chunk_class.name}</i></p>
                        </>
                        )}
                        <p>{vocab.definitions[0]?.text}</p>
                        <p>{vocab.translations[0]?.text}</p>
                    </li>)
                })}
        </ul>
    )
}
    


export default VocabList