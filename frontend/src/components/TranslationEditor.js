import React, { Component } from "react";

// TranslationEditor
class TranslationEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      translation: props.translation
    };
  }

  handleTextChange = (event) => {
    const { translation } = this.state;
    const { onChange } = this.props;
    onChange({
      ...translation,
      text: event.target.value,
    });
  };

  render() {
    const { translation, onChange } = this.props;

    return (
      <div className="form-group">
        <select id="language" className="form-control" value={translation.language || ""} onChange={(event) => {
          this.handleTextChange({
            ...translation,
            language: event.target.value
          });
        }}>
          {/* To do: Replace languages in database */}
          <option value="">Select Language</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
        <label htmlFor="translation">Translation</label>
        <input
          id="translation"
          type="text"
          className="form-control"
          value={translation.text || ""}
          onChange={this.handleTextChange}
        />
      </div>
    );
  }
}

export default TranslationEditor;