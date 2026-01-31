/**
 * CreatePoll Component
 *
 * PURPOSE: A modal form that lets users create new polls.
 * Users enter a question and 2-4 answer options.
 * When submitted, the poll is created and appears for everyone.
 *
 * PROPS:
 * - isOpen: Boolean - whether the modal is visible
 * - onClose: Function to close the modal
 * - onSubmit: Function called with (question, options) when form is submitted
 */

import { useState } from 'react';

function CreatePoll({ isOpen, onClose, onSubmit }) {
  // State for the poll question
  const [question, setQuestion] = useState('');

  // State for answer options (start with 2 empty options)
  const [options, setOptions] = useState(['', '']);

  // Error message to display if validation fails
  const [error, setError] = useState('');

  // Debug log
  console.log('CreatePoll modal open:', isOpen);

  /**
   * Adds a new empty option (max 4)
   */
  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
      console.log('Added new option, total:', options.length + 1);
    }
  };

  /**
   * Removes an option at the given index (min 2)
   */
  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      console.log('Removed option, total:', newOptions.length);
    }
  };

  /**
   * Updates an option's text at the given index
   */
  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  /**
   * Validates the form and submits if valid
   */
  const handleSubmit = (e) => {
    // Prevent page refresh on form submit
    e.preventDefault();
    setError('');

    // Validation: Question must not be empty
    if (question.trim() === '') {
      setError('Please enter a question');
      return;
    }

    // Validation: All options must have text
    const filledOptions = options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      setError('Please enter at least 2 answer options');
      return;
    }

    console.log('Creating poll:', question, filledOptions);

    // Call the parent's submit function
    onSubmit(question.trim(), filledOptions.map(opt => opt.trim()));

    // Reset form
    setQuestion('');
    setOptions(['', '']);
    setError('');
  };

  /**
   * Handles canceling - closes modal and resets form
   */
  const handleCancel = () => {
    setQuestion('');
    setOptions(['', '']);
    setError('');
    onClose();
  };

  // Don't render anything if modal is not open
  if (!isOpen) {
    return null;
  }

  return (
    // Modal overlay (dark background)
    <div className="modal-overlay" onClick={handleCancel}>
      {/* Modal content (clicking inside doesn't close) */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Create a Poll</h2>

        <form onSubmit={handleSubmit}>
          {/* Question Input */}
          <div className="form-group">
            <label htmlFor="poll-question">Question:</label>
            <input
              id="poll-question"
              type="text"
              className="poll-question-input"
              placeholder="What do you want to ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              autoFocus
            />
          </div>

          {/* Answer Options */}
          <div className="form-group">
            <label>Answer Options:</label>
            {options.map((option, index) => (
              <div key={index} className="option-input-row">
                <input
                  type="text"
                  className="poll-option-input"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                />
                {/* Remove button (only if more than 2 options) */}
                {options.length > 2 && (
                  <button
                    type="button"
                    className="remove-option-button"
                    onClick={() => removeOption(index)}
                    title="Remove option"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {/* Add Option button (only if less than 4 options) */}
            {options.length < 4 && (
              <button
                type="button"
                className="add-option-button"
                onClick={addOption}
              >
                + Add Option
              </button>
            )}
          </div>

          {/* Error message */}
          {error && <p className="form-error">{error}</p>}

          {/* Action buttons */}
          <div className="modal-buttons">
            <button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button type="submit" className="submit-button">
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePoll;
