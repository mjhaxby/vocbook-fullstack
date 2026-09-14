import React, { Component } from "react";

// TranslationEditor
class TranslationEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasFocus: false,
    };
  }

  handleChange = (event) => {
    const {name, value} = event.target;

        this.props.onChange({
            ...this.props.translation,
            [name]: value,
        });
  };

  handleFocus = () => {
    this.setState({ hasFocus: true });
  };

  handleBlur = (event) => {
    // Keep open if focus moved to another element inside this component
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    this.setState({ hasFocus: false });
  };

  render() {
    const { translation } = this.props;

    return (
      <div className="form-group editor-line-inner-container translation-editor-container"
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}>
        <div className="form-group editor-line-inner translation-editor">
          <select id="into" className="form-control" value={translation.into || ""} onChange={this.handleChange}>
            {/* To do: Replace languages in database, excluding TL */}
                <option value="">Into…</option>
                <option value="1">EN</option>
                <option value="2">FR</option>
          </select>
          {/* <label htmlFor="text">Translation</label> */}
          <input
            id="text"
            name="text"
            type="text"
            className="form-control main-control"
            value={translation.text || ""}
            placeholder="Translation"
            onChange={this.handleChange}
          />
        </div>
        {/* TO DO: add dialect alongside, but only if there are dialects available */}
          <div className={"form-group editor-line-inner translation-editor"+ (this.state.hasFocus ? "" : " hidden")}>
            <input
              id="tags"
              name="tags"
              type="text"
              className={"form-control main-control"+ (this.state.hasFocus ? "" : " hidden")}
              value={translation.tags || ""}
              placeholder="Tags"
              onChange={this.handleChange}
            />
          </div>
      </div>
    );
  }
}

export default TranslationEditor;