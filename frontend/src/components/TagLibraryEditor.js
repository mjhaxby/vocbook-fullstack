import React from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import api from '../api';
import TagGroupEditor from './TagGroupEditor';
import '../css/tag.css';

// Lists every tag; clicking one opens an inline editor for its text, tag group and languages.
class TagLibraryEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tags: [],
      tagGroups: [],
      languages: [],
      selectedTagId: null,
      draft: null,
      saving: false,
      error: null,
    };
  }

  componentDidMount() {
    this.fetchTags();
    this.fetchTagGroups();
    this.fetchLanguages();    
  }

  componentWillUnmount() {
    this.styleEl?.remove();
  }

  fetchTags = async () => {
    try {
      const response = await api.get('/api/tags/');
      this.setState({ tags: response.data });
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  fetchTagGroups = async () => {
    try {
      const response = await api.get('/api/tag-types/');
      this.setState({ tagGroups: response.data });
      this.injectTagGroupStyles(response.data);
    } catch (error) {
      console.error('Error fetching tag groups:', error);
    }
  };

  fetchLanguages = async () => {
    try {
      const response = await api.get('/api/languages/');
      this.setState({ languages: response.data });
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  reactTagsData = () => {
    return this.state.tags.map((tag) => ({
      id: `tag-${tag.id}`,
      text: tag.text,
      className: `tag tag-group-${tag.tag_group?.id}`,
    }));
  };

    // builds one CSS rule per distinct tag group so its colour can be set at runtime
  injectTagGroupStyles = (groups) => {    

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

  handleTagClick = (index) => {
    const tag = this.state.tags[index];
    if (!tag) {
      return;
    }
    this.setState({
      selectedTagId: tag.id,
      draft: {
        text: tag.text,
        tag_group_id: tag.tag_group ? tag.tag_group.id : '',
        languages_id: tag.languages_id || [],
      },
      error: null,
    });
  };

  updateDraft = (changes) => {
    this.setState((prevState) => ({ draft: { ...prevState.draft, ...changes } }));
  };

  toggleDraftLanguage = (languageId) => {
    const current = this.state.draft.languages_id;
    const languages_id = current.includes(languageId)
      ? current.filter((id) => id !== languageId)
      : [...current, languageId];
    this.updateDraft({ languages_id });
  };

  handleCancel = () => {
    this.setState({ selectedTagId: null, draft: null, error: null });
  };

  handleSave = async () => {
    const { selectedTagId, draft } = this.state;
    this.setState({ saving: true, error: null });
    try {
      await api.patch(`/api/tags/${selectedTagId}/`, {
        text: draft.text,
        tag_group_id: draft.tag_group_id,
        languages_id: draft.languages_id,
      });
      await this.fetchTags();
      this.setState({ selectedTagId: null, draft: null });
    } catch (error) {
      console.error('Error saving tag:', error);
      this.setState({ error: 'Could not save tag.' });
    } finally {
      this.setState({ saving: false });
    }
  };

  handleTagGroupCreated = (newTagGroup) => {
    this.setState((prevState) => ({ tagGroups: [...prevState.tagGroups, newTagGroup], showTagGroupEditor: false }));
  };
  
  addTag = () => {
    const newTag = {
      text: 'New Tag',
      tag_group_id: this.state.tagGroups.length > 0 ? this.state.tagGroups[0].id : null,
      languages_id: [],
    };
    api.post('/api/tags/', newTag)
      .then(response => {
        this.fetchTags();
        this.setState({
          selectedTagId: response.data.id,
          draft: {
            text: response.data.text,
            tag_group_id: response.data.tag_group ? response.data.tag_group.id : '',
            languages_id: response.data.languages_id || [],
          },
          error: null,
        });
      })
      .catch(error => {
        console.error('Error creating tag:', error);
        this.setState({ error: 'Could not create tag.' });
      });
  };

  render() {
    const { tagGroups, languages, draft, saving, error, showTagGroupEditor } = this.state;

    return (
      <div className="tag-library-editor">
        <h3>All Tags</h3>
        <div className="tag-library-list">
          <ReactTags
            tags={this.reactTagsData()}
            handleTagClick={this.handleTagClick}
            handleDelete={() => {}}
            handleAddition={() => {}}            
          />          
        </div>
        <button className="btn btn-success" onClick={this.addTag}>Add Tag</button>

        {draft && (
          <div className="tag-library-detail">
            <h4>Edit Tag</h4>
            <div className="mb-2">
              <label className="form-label">Text</label>
              <input
                type="text"
                className="form-control"
                value={draft.text}
                onChange={(e) => this.updateDraft({ text: e.target.value })}
              />
            </div>            
            <div className="mb-2">
              <label className="form-label">Tag Group</label>
              <select
                className="form-select"
                value={draft.tag_group_id}
                onChange={(e) => this.updateDraft({ tag_group_id: Number(e.target.value) })}
              >
                {tagGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label className="form-label d-block">Languages</label>
              {languages.map((language) => (
                <div className="form-check form-check-inline" key={language.id}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`tag-language-${language.id}`}
                    checked={draft.languages_id.includes(language.id)}
                    onChange={() => this.toggleDraftLanguage(language.id)}
                  />
                  <label className="form-check-label" htmlFor={`tag-language-${language.id}`}>
                    {language.name}
                  </label>
                </div>
              ))}
            </div>

            {error && <p className="text-danger">{error}</p>}

            <button className="btn btn-primary me-2" onClick={this.handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn btn-secondary" onClick={this.handleCancel} disabled={saving}>
              Cancel
            </button>
          </div>
        )}
        <div className="spacer" style={{ height: '50px' }}></div>
        {!showTagGroupEditor && (
        <button className="btn btn-success" onClick={() => this.setState({showTagGroupEditor: true})}>
          Add New Tag Group
        </button>
        )}
        {showTagGroupEditor && (
          <TagGroupEditor onCreated={this.handleTagGroupCreated} />
        )}
      </div>
    );
  }
}

export default TagLibraryEditor;