import React from "react";
import { WithContext as ReactTags, SEPARATORS } from "react-tag-input";
import '../css/tag.css';

class TagViewer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tags: [],
    };
  }

  componentDidMount() {
    this.syncTagsFromProps();
    this.injectTagGroupStyles();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tag_data !== this.props.tag_data || prevProps.class !== this.props.class) {
      this.syncTagsFromProps();
      this.injectTagGroupStyles();
    }
  }  

  componentWillUnmount() {
    this.styleEl?.remove();
  }

  // builds one CSS rule per distinct tag group so its colour can be set at runtime
  injectTagGroupStyles = () => {
    const seen = new Map();
    this.props.tag_data.forEach(tag => seen.set(tag.tag_group.id, tag.tag_group));

    const css = Array.from(seen.values())
      .map(group => `.tag-group-${group.id}{ --bg: ${group.color}; --color: ${this.contrastColor(group.color)}; }`)
      .join('\n');

    if (!this.styleEl) {
      this.styleEl = document.createElement('style');
      this.styleEl.setAttribute('data-tag-group-styles', '');
      document.head.appendChild(this.styleEl);
    }
    this.styleEl.textContent = css;
  }

  // picks black/white text based on the background's perceived brightness
  contrastColor = (hex) => {
    const stripped = hex.replace('#', '');
    // expand shorthand (#eee) to full form (#eeeeee) so the pair-matching below works
    const fullHex = stripped.length === 3 ? stripped.split('').map(c => c + c).join('') : stripped;
    const [r, g, b] = fullHex.match(/\w\w/g).map(h => parseInt(h, 16));
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 150 ? '#000' : '#fff';
  }

  syncTagsFromProps = () => {    
    console.log("Syncing tags from props:", this.props.tag_data);
    console.log("Class info:", this.props.class);
      const tags = [{id: 'classTag', className: `class-tag class-tag-${this.props.class.id}`, text: this.props.class.name}]      
      .concat(this.props.tag_data.map(
        (tag) => {
          return {id: 'tag-' + tag.id, className: `tag tag-group-${tag.tag_group.id} tag-unique-${tag.tag_group.unique}`, text: tag.text}
        }      
      ))

      console.log("Synced tags:", tags);

      this.setState({ tags });
  }

  render(){
    return (
      <div className="tag-viewer">
        <ReactTags
          tags={this.state.tags}
          readOnly={true}
        />
      </div>
    )
  }

}

export default TagViewer;