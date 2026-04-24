## ADDED Requirements

### Requirement: Set custom name for friend from profile
The system SHALL allow users to set a custom display name (note) for any friend from the UserProfileView.

#### Scenario: Set friend note from profile
- **WHEN** user opens a friend's profile page
- **AND** user enters a custom name in the note field
- **THEN** the custom name is saved
- **AND** the custom name replaces the friend's original display name in the sidebar and chat header

### Requirement: Set custom name from chat header
The system SHALL allow users to set a custom display name for the current conversation from the ChatView header menu.

#### Scenario: Set note from chat header
- **WHEN** user clicks the more-options button in the ChatView header
- **AND** user selects "Edit Note" and enters a custom name
- **THEN** the custom name is saved
- **AND** the sidebar and chat header update immediately

### Requirement: Set custom name for group
The system SHALL allow users to set a custom display name (note) for any group conversation from the ChatView header menu.

#### Scenario: Set group note from chat header
- **WHEN** user opens a group conversation's header menu
- **AND** user enters a custom name in the note field
- **THEN** the custom name is saved
- **AND** the custom name replaces the group's original title in the sidebar and chat header

### Requirement: Display original name
The system SHALL show the original name alongside the custom note where appropriate.

#### Scenario: Show both names
- **WHEN** viewing a friend or group's detail page or chat header menu
- **THEN** both the custom note and the original name are visible
- **AND** it is clear which is the note and which is the original name

### Requirement: Remove custom name
The system SHALL allow users to remove a custom name, reverting to the original display name.

#### Scenario: Clear friend note
- **WHEN** user clears the note field and saves from profile or chat header menu
- **THEN** the custom name is removed
- **AND** the original display name is shown again
