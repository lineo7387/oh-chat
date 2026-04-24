## ADDED Requirements

### Requirement: Pin conversation from sidebar
The system SHALL allow users to pin a conversation to the top of the sidebar via the conversation item's dropdown menu.

#### Scenario: Pin from sidebar menu
- **WHEN** user clicks the more-options button on a sidebar conversation item
- **AND** user selects "Pin" from the dropdown menu
- **THEN** the conversation is moved to the top of the sidebar
- **AND** a pin icon appears on the conversation item
- **AND** the pinned state is persisted across sessions

### Requirement: Pin conversation from chat header
The system SHALL allow users to pin the current conversation from the ChatView header menu.

#### Scenario: Pin from chat header
- **WHEN** user clicks the more-options button in the ChatView header
- **AND** user selects "Pin Conversation"
- **THEN** the conversation is pinned
- **AND** the sidebar updates to show the conversation at the top

### Requirement: Unpin conversation
The system SHALL allow users to unpin a previously pinned conversation from any entry point.

#### Scenario: Unpin from sidebar
- **WHEN** user clicks the more-options button on a pinned sidebar conversation item
- **AND** user selects "Unpin"
- **THEN** the conversation returns to its normal position in the sidebar
- **AND** the pin icon is removed

#### Scenario: Unpin from chat header
- **WHEN** user clicks the more-options button in the ChatView header of a pinned conversation
- **AND** user selects "Unpin Conversation"
- **THEN** the conversation is unpinned
- **AND** the sidebar updates to show the conversation in normal position

### Requirement: Multiple pinned conversations ordering
The system SHALL support multiple pinned conversations, ordered by most recently pinned first.

#### Scenario: Multiple pinned conversations
- **WHEN** user pins multiple conversations
- **THEN** all pinned conversations appear at the top of the sidebar
- **AND** they are sorted by pin time, most recent first
- **AND** unpinned conversations appear below all pinned ones

### Requirement: Visual indicator for pinned conversations
The system SHALL provide a visual indicator on pinned conversations in the sidebar.

#### Scenario: Show pin indicator
- **WHEN** a conversation is pinned
- **THEN** a pin icon appears on the conversation item
- **AND** pinned conversations have a subtle visual distinction (e.g., slightly different background)

### Requirement: Pinned conversations in settings
The system SHALL provide a way to view and manage all pinned conversations from the settings page.

#### Scenario: List pinned conversations
- **WHEN** user navigates to the settings page
- **THEN** a list of all pinned conversations is displayed
- **AND** user can unpin any conversation from this list
- **AND** user can reorder pinned conversations
