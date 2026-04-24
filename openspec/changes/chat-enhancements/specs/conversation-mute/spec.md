## ADDED Requirements

### Requirement: Mute conversation from sidebar
The system SHALL allow users to mute a conversation via the sidebar conversation item's dropdown menu.

#### Scenario: Mute from sidebar menu
- **WHEN** user clicks the more-options button on a sidebar conversation item
- **AND** user selects "Mute" from the dropdown menu
- **THEN** the conversation is marked as muted
- **AND** future messages in that conversation do not increment the unread badge
- **AND** the muted state is persisted across sessions

### Requirement: Mute conversation from chat header
The system SHALL allow users to mute a conversation via the ChatView header menu.

#### Scenario: Mute from chat header
- **WHEN** user clicks the more-options button in the ChatView header
- **AND** user toggles the mute switch in the menu
- **THEN** the conversation is marked as muted
- **AND** the sidebar updates to show the muted state

### Requirement: Mute conversation from friend profile
The system SHALL allow users to mute a conversation from the UserProfileView.

#### Scenario: Mute from friend profile
- **WHEN** user opens a friend's profile page
- **AND** user toggles the mute switch
- **THEN** the conversation with that friend is muted
- **AND** the muted state is persisted across sessions

### Requirement: Unmute conversation
The system SHALL allow users to unmute a previously muted conversation from any of the above entry points.

#### Scenario: Unmute a conversation
- **WHEN** user toggles off the mute setting from sidebar menu, chat header, or friend profile
- **THEN** the conversation is unmuted
- **AND** future messages resume incrementing the unread badge

### Requirement: Visual indicator for muted conversations
The system SHALL provide a visual indicator on muted conversations in the sidebar.

#### Scenario: Show muted indicator
- **WHEN** a conversation is muted
- **THEN** a muted icon (e.g., bell-slash) appears on the conversation item in the sidebar
- **AND** the muted state is visually distinct from unmuted conversations

### Requirement: Muted conversations in settings
The system SHALL provide a way to view and manage all muted conversations from the settings page.

#### Scenario: List muted conversations
- **WHEN** user navigates to the notification/mute settings page
- **THEN** a list of all muted conversations is displayed
- **AND** user can unmute any conversation from this list
