import React from "react";
import { WithContext as ReactTags, SEPARATORS } from "react-tag-input";
import '../css/tag.css';

class TagEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tags: [],
    };
  }



  componentDidMount() {
    this.syncTagsFromProps();
  }

  componentWillUnmount() {
    this.styleEl?.remove();
  }

  componentDidUpdate(prevProps) {
    const tagIdsChanged = prevProps.tag_ids !== this.props.tag_ids;
    const classIdsChanged = prevProps.class_ids !== this.props.class_ids;
    const newTagIdsChanged = prevProps.new_tags !== this.props.new_tags;
    const tagLibraryChanged = prevProps.tagLibrary !== this.props.tagLibrary;
    const classLibraryChanged = prevProps.classLibrary !== this.props.classLibrary;

    if (tagIdsChanged || classIdsChanged || newTagIdsChanged || tagLibraryChanged || classLibraryChanged) {
      this.syncTagsFromProps();      
    }

    this.injectTagGroupStyles(this.props.tagLibrary);
  }

  syncTagsFromProps = () => {
    const tagIds = this.props.tag_ids || [];
    const classIDs = this.props.class_ids || [];
    const newTags = this.props.new_tags || [];
    const tagLibrary = this.props.tagLibrary || [];
    const classLibrary = this.props.classLibrary || [];

    console.log("Syncing tags from props:", tagIds, classIDs, newTags);
    const tags = classIDs
      .map((classId) => classLibrary.find((cls) => cls.id === 'class-' + classId) ?? null)
      .filter(Boolean)
      .concat(
        tagIds
          .map((tagId) => tagLibrary.find((t) => t.id === 'tag-' + tagId) ?? null)
          .filter(Boolean)
          .concat(
            newTags.map(tag => ({
              id: `tag-${tag.text}`,
              text: tag.text,
              className: "generic",
              unique: false
            }))
          )
      );
    console.log("Synced tags:", tags);
    this.setState({ tags });
  };

  addTag(tag) {
    this.props.handleAddition(tag);
  }

// builds one CSS rule per distinct tag group so its colour can be set at runtime
  injectTagGroupStyles = (tagLibrary) => {    

    const groups = tagLibrary.map(tag => {
        return {
            id: tag.tag_group_id,
            color: tag.tag_group_color
        };
    }).reduce((acc, group) => {
        if (!acc.some(g => g.id === group.id)) {
            acc.push(group);
        }
        return acc;
    }, []);

    console.log('tag groups:', groups)

    const css = groups
      .map(group => `.tag-group-${group.id}{ --bg: ${group.color}; --color: ${this.contrastColor(group.color)}; }`)
      .join('\n');

    console.log("Injecting tag group styles:", css);

    if (!this.styleEl) {
      this.styleEl = document.createElement('style');
      this.styleEl.setAttribute('data-tag-group-styles', '');
      document.head.appendChild(this.styleEl);
    }
    this.styleEl.textContent = css;
  }

  contrastColor = (hex) => {
    const stripped = hex.replace('#', '');
    // expand shorthand (#eee) to full form (#eeeeee) so the pair-matching below works
    const fullHex = stripped.length === 3 ? stripped.split('').map(c => c + c).join('') : stripped;
    const [r, g, b] = fullHex.match(/\w\w/g).map(h => parseInt(h, 16));
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 150 ? '#000' : '#fff';
  }



  render() {
    const {
      handleDelete,
      handleDrag,
      tagLibrary = [],
      classLibrary = [],
    } = this.props;

    const suggestions = tagLibrary.concat(classLibrary);

    console.log("Suggestions for tag editor:", suggestions);

    return (
      <div className="tag-editor">
        <ReactTags
          tags={this.state.tags}
          suggestions={suggestions}
          handleDelete={handleDelete}
          handleAddition={this.addTag.bind(this)}          
          separators={[SEPARATORS.COMMA, SEPARATORS.ENTER]}
          placeholder="Add a tag"
          allowDragDrop={false}
          // to do: on key down, if tab, autofill (but don't add yet) the first suggestion
        />
      </div>
    );
  }
}

export default TagEditor;

// SEE: https://www.npmjs.com/package/react-tag-input#Options

// So the idea is that we pass to the tag editor: a list of tag IDs, the tag level ("lemma_level", "definition_level", or "translation_level") – which will be depending essentially on WHERE we are putting the tag editor
// The tag editor will then fetch the list of all tags from the backend, and filter them based on the tag level, and then display them as suggestions in the tag editor.
// The user can then add or remove tags, and the tag editor will call the appropriate callback functions to update the parent component's state with the new list of tag IDs.
// What I'm not too sure on yet: The tag_group.name and tag_group.unique fields will modify how the tags are shown. 

  // TO DO: Filter out tags based on word/chunk class restrictions.
  // TO DO: When the class is changed, show tags that are no longer allowed as disabled or in red (won't be saved)
  // If changing between lemma and chunk, will also need to modify the class. Might be worth being able to link word and chunk classes?