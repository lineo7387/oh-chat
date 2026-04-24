## ADDED Requirements

### Requirement: Unread count badge in sidebar
The system SHALL display an unread message count badge on conversation items in the sidebar.

#### Scenario: Show unread count
- **WHEN** a conversation has unread messages
- **THEN** the sidebar conversation item displays a numeric badge with the unread count
- **AND** the badge is visually distinct (e.g., colored background)

#### Scenario: Hide unread count when zero
- **WHEN** a conversation has no unread messages
- **THEN** no badge is displayed on the conversation item

### Requirement: Unread message boundary line
The system SHALL display a visual boundary line in the chat view separating read and unread messages.

#### Scenario: Show unread boundary
- **WHEN** user opens a conversation with unread messages
- **THEN** a labeled line (e.g., "New messages") appears above the first unread message
- **AND** the line disappears after the user has viewed the conversation

### Requirement: Mark conversation as read
The system SHALL mark a conversation as read when the user opens it and views the latest messages.

#### Scenario: Auto-mark as read
- **WHEN** user opens a conversation and the messages are loaded
- **THEN** the unread count for that conversation resets to zero
- **AND** the sidebar badge updates immediately

### Requirement: Unread count increment on new message
The system SHALL increment the unread count when a new message arrives in a conversation the user is not currently viewing.

#### Scenario: Increment unread for background conversation
- **WHEN** a new message arrives in a conversation other than the current one
- **THEN** the unread count for that conversation increases by one
- **AND** the sidebar badge updates in real-time

#### Scenario: No increment for current conversation
- **WHEN** a new message arrives in the currently open conversation
- **THEN** the unread count does not increase
