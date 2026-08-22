import React, { Component } from "react";

// DefinitionEditor
class DefinitionEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      definition: props.definition
    };
  }

  handleTextChange = (event) => {
    const { definition } = this.state;
    const { onChange } = this.props;
    onChange({
      ...definition,
      text: event.target.value,
    });
  };

  render() {
    const { definition } = this.props;
    return (
        <div className="form-group">
        <label htmlFor="definition">Definition</label>
        <input
            id="definition"
            type="text"
            className="form-control"
            value={definition.text || ""}
            onChange={this.handleTextChange}
        />
        </div>
    );
}
}

export default DefinitionEditor;