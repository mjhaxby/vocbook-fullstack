import React, { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../css/vocab-list.css";

function VocabListItem({ vocab, viewVocab, editVocab }) {
    const [isOpen, setIsOpen] = useState(false);
    const detailsId = useId();

    return (
        <li className="list-group-item">
            <h3 className="vocab-list-heading">
                <button
                    type="button"
                    className="vocab-list-toggle"
                    aria-expanded={isOpen}
                    aria-controls={detailsId}
                    onClick={() => setIsOpen(open => !open)}
                >
                    <span>
                        {vocab.is_lemma && vocab.lemma.headword.text}
                        {vocab.is_chunk && vocab.chunk.headchunk.text}
                    </span>
                    <span className={`open-close-indicator ${isOpen ? 'is-open' : 'is-closed'}`} aria-hidden="true"><FontAwesomeIcon icon="chevron-down" /></span>
                </button>
            </h3>
            <div
                id={detailsId}
                className={`vocab-list-details${isOpen ? " is-open" : ""}`}
                aria-hidden={!isOpen}
                inert={!isOpen}
            >
                <div className="vocab-list-details-inner">
                    {vocab.is_lemma && (
                        <>
                            <p style={{ fontSize: '0.9em' }}>({vocab.lemma.types.filter(type => !type.is_headword).map(type => type.text).join(', ')})</p>
                            <p><i>{vocab.lemma.word_class.name}</i> /{vocab.lemma.headword.ipa_text}/</p>
                        </>
                    )}
                    {vocab.is_chunk && (
                        <p><i>{vocab.chunk.chunk_class.name}</i></p>
                    )}
                    <p>{vocab.definitions[0]?.text}</p>
                    <p>{vocab.translations[0]?.text}</p>
                    <div className="btn-group" role="group" aria-label="Actions">
                        <button className="btn btn-primary" onClick={() => viewVocab(vocab.id)}>View</button>
                        <button className="btn btn-secondary" onClick={() => editVocab(vocab.id)}>Edit</button>
                        <button className="btn btn-danger">Delete</button>
                    </div>
                </div>
            </div>
        </li>
    );
}

function VocabList({ vocabs }) {
    const navigate = useNavigate();

    if (!vocabs || vocabs.length === 0) {
        return <p className="text-muted">No vocabulary yet.</p>;
    }

    const viewVocab = (vocabId) => {
        navigate(`/vocab/${vocabId}`);
    };

    const editVocab = (vocabId) => {
        navigate(`/vocab/edit/${vocabId}`);
    };

    return (
        <div>
            <div className="controls">
                <button className="btn btn-primary btn-icon" onClick={() => navigate('/vocab/edit/new')}><FontAwesomeIcon icon="plus" /></button>
                <div className="sub-controls">
                    <button className="btn btn-secondary"><FontAwesomeIcon icon="filter" /> Filter</button>
                    <button className="btn btn-secondary"><FontAwesomeIcon icon="arrow-down-wide-short" /> Sort</button>
                </div>
            </div>
            <ul className="list-group frame">
                {vocabs.map(vocab => (
                    <VocabListItem key={vocab.id} vocab={vocab} viewVocab={viewVocab} editVocab={editVocab} />
                ))}
            </ul>
        </div>
    );
}

export default VocabList;
