## ADDED Requirements

### Requirement: Emoji picker panel toggle
The system SHALL provide an emoji picker panel that can be opened and closed by clicking a smiley icon button in the message input area.

#### Scenario: Open emoji picker
- **WHEN** user clicks the smiley icon button in the message input area
- **THEN** an emoji picker panel appears above the input area

#### Scenario: Close emoji picker
- **WHEN** user clicks the smiley icon button again or clicks outside the panel
- **THEN** the emoji picker panel closes

### Requirement: Emoji categories
The system SHALL display emojis organized into categories (e.g., Smileys, Nature, Food, Activities, Travel, Objects, Symbols).

#### Scenario: Browse emoji categories
- **WHEN** the emoji picker is open
- **THEN** user sees a grid of emoji grouped by category with category tabs/labels

### Requirement: Emoji insertion
The system SHALL insert the selected emoji into the message input field at the current cursor position.

#### Scenario: Insert emoji into message
- **WHEN** user clicks an emoji in the picker panel
- **THEN** the emoji is appended to the message text input at the cursor position
- **AND** the input field retains focus

### Requirement: Recent emoji
The system SHALL display recently used emojis in a dedicated "Recent" category at the top of the picker.

#### Scenario: Show recently used emojis
- **WHEN** user has previously sent messages containing emojis
- **THEN** the most recently used emojis appear in the "Recent" category
- **AND** the recent list persists across sessions using localStorage

### Requirement: Emoji search
The system SHALL allow users to search emojis by keyword.

#### Scenario: Search for emoji
- **WHEN** user types a keyword in the emoji picker search field
- **THEN** only emojis matching that keyword are displayed
