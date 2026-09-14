import React, { Component } from "react";

// DefinitionEditor
class DefinitionEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasFocus: false,
    };
  }

  handleChange = (event) => {
    const {name, value} = event.target;
    this.props.onChange({
            ...this.props.definition,
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
    const { definition } = this.props;
    return (
      <div className="form-group editor-line-inner-container definition-editor-container"
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}>
        <div className="form-group editor-line-inner definition-editor">
        <input
            id="text"
            name="text"
            type="text"
            className="form-control main-control"
            placeholder="Definition"
            value={definition.text || ""}
            onChange={this.handleChange}
          />            
        </div>
          <div className={"form-group editor-line-inner definition-editor" + (this.state.hasFocus ? "" : " hidden")}>
            <input
              id="tags"
              name="tags"
              type="text"
              className="form-control main-control"
              value={definition.tags || ""}
              placeholder="Tags"
              onChange={this.handleChange}
            />
          </div>
        </div>
    );
}
}

export default DefinitionEditor;