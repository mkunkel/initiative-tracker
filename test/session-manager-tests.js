// Session Manager Tests
const { expect } = require('chai');
const SessionManager = require('../js/session-manager.js');

describe('SessionManager', () => {
    let sessionManager;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        sessionManager = new SessionManager();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('Initialization', () => {
        it('should initialize with empty sessions when no data exists', () => {
            expect(Object.keys(sessionManager.sessions).length).to.equal(0);
        });

        it('should load sessions from localStorage if they exist', () => {
            const mockSessions = {
                'campaign-123': {
                    id: 'campaign-123',
                    name: 'Test Campaign',
                    type: 'campaign',
                    characters: []
                }
            };
            localStorage.setItem('it_sessions', JSON.stringify(mockSessions));

            const sm = new SessionManager();
            expect(Object.keys(sm.sessions).length).to.equal(1);
            expect(sm.sessions['campaign-123'].name).to.equal('Test Campaign');
        });

        it('should migrate old localStorage data to session system', () => {
            const oldCharacters = [
                { id: 1, name: 'Hero', hp: 10, completed: false }
            ];
            localStorage.setItem('characters', JSON.stringify(oldCharacters));
            localStorage.setItem('currentRound', '3');
            localStorage.setItem('selectedTheme', 'pirate-borg');

            const sm = new SessionManager();

            // Should create a quick game session with old data
            const sessions = sm.getAllSessions();
            expect(sessions.length).to.equal(1);
            expect(sessions[0].type).to.equal('quick');
            expect(sessions[0].characters.length).to.equal(1);
            expect(sessions[0].currentRound).to.equal(3);
            expect(sessions[0].theme).to.equal('pirate-borg');

            // Old keys should be removed
            expect(localStorage.getItem('characters')).to.be.null;
            expect(localStorage.getItem('currentRound')).to.be.null;
        });
    });

    describe('Session Creation', () => {
        it('should create a new campaign session', () => {
            const sessionId = sessionManager.createSession('My Campaign', 'campaign', 'mork-borg');

            expect(sessionId).to.exist;
            expect(sessionId.startsWith('campaign-')).to.equal(true);

            const session = sessionManager.getSession(sessionId);
            expect(session.name).to.equal('My Campaign');
            expect(session.type).to.equal('campaign');
            expect(session.theme).to.equal('mork-borg');
            expect(session.characters).to.deep.equal([]);
            expect(session.currentRound).to.equal(1);
            expect(session.extendedCount).to.equal(0);
        });

        it('should create a new quick game session', () => {
            const sessionId = sessionManager.createSession('Quick Game', 'quick');

            expect(sessionId.startsWith('quick-')).to.equal(true);

            const session = sessionManager.getSession(sessionId);
            expect(session.type).to.equal('quick');
        });

        it('should persist session to localStorage', () => {
            const sessionId = sessionManager.createSession('Test', 'campaign');

            const stored = JSON.parse(localStorage.getItem('it_sessions'));
            expect(stored[sessionId]).to.exist;
            expect(stored[sessionId].name).to.equal('Test');
        });
    });

    describe('Session Retrieval', () => {
        it('should get session by ID', () => {
            const sessionId = sessionManager.createSession('Test', 'campaign');
            const session = sessionManager.getSession(sessionId);

            expect(session).to.exist;
            expect(session.id).to.equal(sessionId);
        });

        it('should return null for non-existent session', () => {
            const session = sessionManager.getSession('fake-id');
            expect(session).to.be.null;
        });

        it('should get all sessions sorted by last played', () => {
            const id1 = sessionManager.createSession('Session 1', 'campaign');
            const id2 = sessionManager.createSession('Session 2', 'quick');

            // Update session 1 to be more recent
            sessionManager.updateSession(id1, { characters: [{ id: 1 }] });

            const sessions = sessionManager.getAllSessions();
            expect(sessions.length).to.equal(2);
            expect(sessions[0].id).to.equal(id1); // Most recent first
        });

        it('should get sessions by type', () => {
            sessionManager.createSession('Campaign 1', 'campaign');
            sessionManager.createSession('Campaign 2', 'campaign');
            sessionManager.createSession('Quick 1', 'quick');

            const campaigns = sessionManager.getSessionsByType('campaign');
            const quickGames = sessionManager.getSessionsByType('quick');

            expect(campaigns.length).to.equal(2);
            expect(quickGames.length).to.equal(1);
        });
    });

    describe('Session Updates', () => {
        it('should update session data', () => {
            const sessionId = sessionManager.createSession('Test', 'campaign');

            const result = sessionManager.updateSession(sessionId, {
                characters: [{ id: 1, name: 'Hero' }],
                currentRound: 5
            });

            expect(result).to.equal(true);

            const session = sessionManager.getSession(sessionId);
            expect(session.characters.length).to.equal(1);
            expect(session.currentRound).to.equal(5);
        });

        it('should return false for non-existent session', () => {
            const result = sessionManager.updateSession('fake-id', { test: 'data' });
            expect(result).to.equal(false);
        });
    });

    describe('Session Deletion', () => {
        it('should delete a session', () => {
            const sessionId = sessionManager.createSession('Test', 'campaign');

            const result = sessionManager.deleteSession(sessionId);
            expect(result).to.equal(true);

            const session = sessionManager.getSession(sessionId);
            expect(session).to.be.null;
        });

        it('should remove session from localStorage', () => {
            const sessionId = sessionManager.createSession('Test', 'campaign');
            sessionManager.deleteSession(sessionId);

            const stored = JSON.parse(localStorage.getItem('it_sessions'));
            expect(stored[sessionId]).to.be.undefined;
        });

        it('should clear current session if deleted', () => {
            const sessionId = sessionManager.createSession('Test', 'campaign');
            sessionManager.setCurrentSessionId(sessionId);

            sessionManager.deleteSession(sessionId);

            expect(sessionManager.currentSessionId).to.be.null;
            expect(localStorage.getItem('it_currentSession')).to.be.null;
        });

        it('should return false for non-existent session', () => {
            const result = sessionManager.deleteSession('fake-id');
            expect(result).to.equal(false);
        });
    });

    describe('Session Renaming', () => {
        it('should rename a session', () => {
            const sessionId = sessionManager.createSession('Old Name', 'campaign');

            const result = sessionManager.renameSession(sessionId, 'New Name');
            expect(result).to.equal(true);

            const session = sessionManager.getSession(sessionId);
            expect(session.name).to.equal('New Name');
        });

        it('should return false for non-existent session', () => {
            const result = sessionManager.renameSession('fake-id', 'New Name');
            expect(result).to.equal(false);
        });
    });

    describe('Quick Game Promotion', () => {
        it('should promote quick game to campaign', () => {
            const sessionId = sessionManager.createSession('Quick Game', 'quick');

            const result = sessionManager.promoteToCarnapaign(sessionId, 'My Campaign');
            expect(result).to.equal(true);

            const session = sessionManager.getSession(sessionId);
            expect(session.type).to.equal('campaign');
            expect(session.name).to.equal('My Campaign');
            expect(session.extendedCount).to.be.undefined;
        });

        it('should not promote campaign to campaign', () => {
            const sessionId = sessionManager.createSession('Campaign', 'campaign');

            const result = sessionManager.promoteToCarnapaign(sessionId, 'New Name');
            expect(result).to.equal(false);
        });
    });

    describe('Session Extension', () => {
        it('should extend quick game session', () => {
            const sessionId = sessionManager.createSession('Quick Game', 'quick');

            const result = sessionManager.extendSession(sessionId);
            expect(result).to.equal(true);

            const session = sessionManager.getSession(sessionId);
            expect(session.extendedCount).to.equal(1);
        });

        it('should increment extension count on multiple extensions', () => {
            const sessionId = sessionManager.createSession('Quick Game', 'quick');

            sessionManager.extendSession(sessionId);
            sessionManager.extendSession(sessionId);
            sessionManager.extendSession(sessionId);

            const session = sessionManager.getSession(sessionId);
            expect(session.extendedCount).to.equal(3);
        });

        it('should not extend campaign sessions', () => {
            const sessionId = sessionManager.createSession('Campaign', 'campaign');

            const result = sessionManager.extendSession(sessionId);
            expect(result).to.equal(false);
        });
    });

    describe('Expiration Checking', () => {
        it('should calculate days since last played', () => {
            const sessionId = sessionManager.createSession('Test', 'quick');
            const session = sessionManager.getSession(sessionId);

            // Set lastPlayed to 10 days ago
            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
            session.lastPlayed = tenDaysAgo.toISOString();
            sessionManager.sessions[sessionId] = session;

            const days = sessionManager.daysSinceLastPlayed(session);
            expect(days).to.be.at.least(10);
            expect(days).to.be.at.most(11); // Allow for some time passing
        });

        it('should identify expired quick games', () => {
            const sessionId = sessionManager.createSession('Old Quick Game', 'quick');
            const session = sessionManager.getSession(sessionId);

            // Set lastPlayed to 35 days ago
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 35);
            session.lastPlayed = oldDate.toISOString();
            sessionManager.sessions[sessionId] = session;
            sessionManager.saveSessions();

            const expired = sessionManager.getExpiredQuickGames();
            expect(expired.length).to.equal(1);
            expect(expired[0].id).to.equal(sessionId);
        });

        it('should identify warning period quick games', () => {
            const sessionId = sessionManager.createSession('Warning Quick Game', 'quick');
            const session = sessionManager.getSession(sessionId);

            // Set lastPlayed to 27 days ago (in warning period: 25-30 days)
            const warningDate = new Date();
            warningDate.setDate(warningDate.getDate() - 27);
            session.lastPlayed = warningDate.toISOString();
            sessionManager.sessions[sessionId] = session;
            sessionManager.saveSessions();

            const warning = sessionManager.getWarningQuickGames();
            expect(warning.length).to.equal(1);
            expect(warning[0].id).to.equal(sessionId);
        });

        it('should calculate days until expiration', () => {
            const sessionId = sessionManager.createSession('Test', 'quick');
            const session = sessionManager.getSession(sessionId);

            // Set lastPlayed to 20 days ago
            const date = new Date();
            date.setDate(date.getDate() - 20);
            session.lastPlayed = date.toISOString();
            sessionManager.sessions[sessionId] = session;

            const daysLeft = sessionManager.getDaysUntilExpiration(session);
            expect(daysLeft).to.be.at.least(9);
            expect(daysLeft).to.be.at.most(10);
        });

        it('should return null for campaign expiration check', () => {
            const sessionId = sessionManager.createSession('Campaign', 'campaign');
            const session = sessionManager.getSession(sessionId);

            const daysLeft = sessionManager.getDaysUntilExpiration(session);
            expect(daysLeft).to.be.null;
        });
    });

    describe('Session Switching', () => {
        it('should switch to a different session', () => {
            const id1 = sessionManager.createSession('Session 1', 'campaign');
            const id2 = sessionManager.createSession('Session 2', 'campaign');

            const result = sessionManager.switchSession(id2);
            expect(result).to.equal(true);
            expect(sessionManager.currentSessionId).to.equal(id2);
            expect(localStorage.getItem('it_currentSession')).to.equal(id2);
        });

        it('should return false for non-existent session', () => {
            const result = sessionManager.switchSession('fake-id');
            expect(result).to.equal(false);
        });
    });

    describe('Session Duplication', () => {
        it('should duplicate a session', () => {
            const originalId = sessionManager.createSession('Original', 'campaign');
            sessionManager.updateSession(originalId, {
                characters: [{ id: 1, name: 'Hero' }],
                currentRound: 5
            });

            const duplicateId = sessionManager.duplicateSession(originalId, 'Copy');
            expect(duplicateId).to.exist;
            expect(duplicateId).to.not.equal(originalId);

            const duplicate = sessionManager.getSession(duplicateId);
            expect(duplicate.name).to.equal('Copy');
            expect(duplicate.characters.length).to.equal(1);
            expect(duplicate.currentRound).to.equal(5);
            expect(duplicate.extendedCount).to.equal(0); // Reset for duplicate
        });

        it('should return null for non-existent session', () => {
            const result = sessionManager.duplicateSession('fake-id', 'Copy');
            expect(result).to.be.null;
        });
    });

    describe('Session Export/Import', () => {
        it('should export session as JSON in portable format', () => {
            const sessionId = sessionManager.createSession('Test', 'campaign');
            sessionManager.updateSession(sessionId, {
                characters: [{ id: 1, name: 'Hero' }]
            });

            const exported = sessionManager.exportSession(sessionId);
            expect(exported).to.exist;

            const parsed = JSON.parse(exported);
            expect(parsed).to.have.property('version');
            expect(parsed).to.have.property('sessions');
            expect(parsed.sessions).to.be.an('array');
            expect(parsed.sessions[0].name).to.equal('Test');
            expect(parsed.sessions[0].characters.length).to.equal(1);
        });

        it('should return null for non-existent session export', () => {
            const result = sessionManager.exportSession('fake-id');
            expect(result).to.be.null;
        });

        it('should import sessions from portable JSON format', () => {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                sessions: [{
                    id: 'test-123',
                    name: 'Imported Session',
                    type: 'campaign',
                    theme: 'cy-borg',
                    characters: [{ id: 1, name: 'Hero' }],
                    currentRound: 3,
                    createdAt: new Date().toISOString(),
                    lastPlayed: new Date().toISOString()
                }]
            };

            const result = sessionManager.importSessions(JSON.stringify(exportData));
            expect(result.success).to.be.true;
            expect(result.imported).to.equal(1);

            const sessions = sessionManager.getAllSessions();
            const imported = sessions.find(s => s.name === 'Imported Session');
            expect(imported).to.exist;
            expect(imported.characters.length).to.equal(1);
            expect(imported.currentRound).to.equal(3);
        });

        it('should reject invalid JSON import', () => {
            const result = sessionManager.importSessions('invalid json');
            expect(result.success).to.be.false;
            expect(result.error).to.exist;
        });
    });

    describe('Current Session Management', () => {
        it('should get current session', () => {
            const sessionId = sessionManager.createSession('Current', 'campaign');
            sessionManager.setCurrentSessionId(sessionId);

            const current = sessionManager.getCurrentSession();
            expect(current).to.exist;
            expect(current.id).to.equal(sessionId);
        });

        it('should return null when no current session', () => {
            const current = sessionManager.getCurrentSession();
            expect(current).to.be.null;
        });
    });

    describe('Export Functionality', () => {
        beforeEach(() => {
            // Create some test sessions
            sessionManager.createCampaign('Campaign 1');
            sessionManager.createCampaign('Campaign 2');
            sessionManager.createQuickGame();
        });

        it('should export a single session as JSON', () => {
            const sessions = sessionManager.getAllSessions();
            const sessionId = sessions[0].id;

            const exported = sessionManager.exportSession(sessionId);

            expect(exported).to.be.a('string');
            const parsed = JSON.parse(exported);
            expect(parsed).to.have.property('version');
            expect(parsed).to.have.property('exportDate');
            expect(parsed).to.have.property('sessions');
            expect(parsed.sessions).to.be.an('array');
            expect(parsed.sessions.length).to.equal(1);
            expect(parsed.sessions[0].id).to.equal(sessionId);
        });

        it('should export all sessions as JSON', () => {
            const exported = sessionManager.exportAllSessions();

            expect(exported).to.be.a('string');
            const parsed = JSON.parse(exported);
            expect(parsed).to.have.property('version');
            expect(parsed).to.have.property('exportDate');
            expect(parsed).to.have.property('sessions');
            expect(parsed.sessions).to.be.an('array');
            expect(parsed.sessions.length).to.equal(3);
        });

        it('should return null when exporting non-existent session', () => {
            const exported = sessionManager.exportSession('invalid-id');
            expect(exported).to.be.null;
        });

        it('should include session data in export', () => {
            const sessions = sessionManager.getAllSessions();
            const sessionId = sessions[0].id;

            // Add some data to the session
            sessionManager.updateSession(sessionId, {
                characters: [{ id: 1, name: 'Test', hp: 10 }],
                currentRound: 5
            });

            const exported = sessionManager.exportSession(sessionId);
            const parsed = JSON.parse(exported);

            expect(parsed.sessions[0].characters).to.be.an('array');
            expect(parsed.sessions[0].characters.length).to.equal(1);
            expect(parsed.sessions[0].currentRound).to.equal(5);
        });
    });

    describe('Import Functionality', () => {
        it('should import valid JSON data', () => {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                sessions: [{
                    id: 'imported-1',
                    name: 'Imported Campaign',
                    type: 'campaign',
                    characters: [{ id: 1, name: 'Hero', hp: 10 }],
                    currentRound: 1,
                    createdAt: new Date().toISOString(),
                    lastPlayed: new Date().toISOString()
                }]
            };

            const result = sessionManager.importSessions(JSON.stringify(exportData));

            expect(result.success).to.be.true;
            expect(result.imported).to.equal(1);
            expect(result.skipped).to.equal(0);

            const sessions = sessionManager.getAllSessions();
            expect(sessions.length).to.equal(1);
            expect(sessions[0].name).to.equal('Imported Campaign');
        });

        it('should handle duplicate session IDs by renaming', () => {
            // Create a session
            const originalId = sessionManager.createCampaign('Original');

            // Try to import a session with the same ID
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                sessions: [{
                    id: originalId,
                    name: 'Imported Duplicate',
                    type: 'campaign',
                    characters: [],
                    currentRound: 1,
                    createdAt: new Date().toISOString(),
                    lastPlayed: new Date().toISOString()
                }]
            };

            const result = sessionManager.importSessions(JSON.stringify(exportData));

            expect(result.success).to.be.true;
            expect(result.imported).to.equal(1);

            const sessions = sessionManager.getAllSessions();
            expect(sessions.length).to.equal(2);

            // Check that names are different (one should be renamed)
            const names = sessions.map(s => s.name);
            expect(names).to.include('Original');
            expect(names).to.include('Imported Duplicate (imported)');
        });

        it('should reject invalid JSON', () => {
            const result = sessionManager.importSessions('invalid json');

            expect(result.success).to.be.false;
            expect(result.error).to.exist;
        });

        it('should reject data without required fields', () => {
            const invalidData = {
                version: '1.0'
                // missing sessions
            };

            const result = sessionManager.importSessions(JSON.stringify(invalidData));

            expect(result.success).to.be.false;
            expect(result.error).to.exist;
        });

        it('should skip invalid sessions in import', () => {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                sessions: [
                    {
                        id: 'valid-1',
                        name: 'Valid Session',
                        type: 'campaign',
                        characters: [],
                        currentRound: 1,
                        createdAt: new Date().toISOString(),
                        lastPlayed: new Date().toISOString()
                    },
                    {
                        // Missing required fields
                        name: 'Invalid Session'
                    }
                ]
            };

            const result = sessionManager.importSessions(JSON.stringify(exportData));

            expect(result.success).to.be.true;
            expect(result.imported).to.equal(1);
            expect(result.skipped).to.equal(1);

            const sessions = sessionManager.getAllSessions();
            expect(sessions.length).to.equal(1);
        });

        it('should import multiple sessions', () => {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                sessions: [
                    {
                        id: 'imported-1',
                        name: 'Campaign 1',
                        type: 'campaign',
                        characters: [],
                        currentRound: 1,
                        createdAt: new Date().toISOString(),
                        lastPlayed: new Date().toISOString()
                    },
                    {
                        id: 'imported-2',
                        name: 'Campaign 2',
                        type: 'campaign',
                        characters: [],
                        currentRound: 1,
                        createdAt: new Date().toISOString(),
                        lastPlayed: new Date().toISOString()
                    }
                ]
            };

            const result = sessionManager.importSessions(JSON.stringify(exportData));

            expect(result.success).to.be.true;
            expect(result.imported).to.equal(2);

            const sessions = sessionManager.getAllSessions();
            expect(sessions.length).to.equal(2);
        });
    });
});

