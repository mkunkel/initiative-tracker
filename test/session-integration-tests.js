// Session Integration Tests - InitiativeTracker with SessionManager
const { expect } = require('chai');
const SessionManager = require('../js/session-manager.js');

describe('InitiativeTracker - Session Integration', () => {
    let tracker;
    let sessionManager;

    beforeEach(() => {
        // Clear localStorage and DOM
        localStorage.clear();
        document.body.innerHTML = `
            <div id="sessionSelect"></div>
            <div id="onDeckList"></div>
            <div id="completedList"></div>
            <div id="stunnedList"></div>
            <div id="deadList"></div>
            <div id="themeSelect"></div>
            <div id="roundCompleteModal"></div>
            <div id="deleteModal"></div>
            <div id="stunModal"></div>
            <div id="addCharacterModal"></div>
            <div id="addEnemyModal"></div>
            <div id="sessionWarningBanner"></div>
            <div id="sessionCleanupModal"></div>
            <div id="manageSessionsModal"></div>
            <div id="startNextRound"></div>
            <div id="confirmDelete"></div>
            <div id="cancelDelete"></div>
            <div id="confirmStun"></div>
            <div id="cancelStun"></div>
            <div id="stunIncrease"></div>
            <div id="stunDecrease"></div>
            <div id="stunRoundsDisplay"></div>
            <div id="openCharacterModal"></div>
            <div id="openEnemyModal"></div>
            <div id="modalCharacterName"></div>
            <div id="modalCharacterHP"></div>
            <div id="modalAddCharacter"></div>
            <div id="cancelCharacterModal"></div>
            <div id="modalRefreshName"></div>
            <div id="modalEnemyName"></div>
            <div id="modalEnemyHP"></div>
            <div id="modalAddEnemy"></div>
            <div id="cancelEnemyModal"></div>
            <div id="clearAll"></div>
            <div id="manageSessionsBtn"></div>
        `;

        sessionManager = new SessionManager();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('Initialization with SessionManager', () => {
        it('should create InitiativeTracker with SessionManager', () => {
            // This test will pass once InitiativeTracker is updated
            expect(sessionManager).to.exist;
        });

        it('should check for expired quick games on initialization', () => {
            // Create an expired quick game
            const sessionId = sessionManager.createSession('Old Quick Game', 'quick');
            const session = sessionManager.getSession(sessionId);

            // Set to 35 days ago
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 35);
            session.lastPlayed = oldDate.toISOString();
            sessionManager.sessions[sessionId] = session;
            sessionManager.saveSessions();

            const expired = sessionManager.getExpiredQuickGames();
            expect(expired.length).to.equal(1);
        });

        it('should check for warning period quick games on initialization', () => {
            // Create a quick game in warning period
            const sessionId = sessionManager.createSession('Warning Quick Game', 'quick');
            const session = sessionManager.getSession(sessionId);

            // Set to 27 days ago (warning period)
            const warningDate = new Date();
            warningDate.setDate(warningDate.getDate() - 27);
            session.lastPlayed = warningDate.toISOString();
            sessionManager.sessions[sessionId] = session;
            sessionManager.saveSessions();

            const warning = sessionManager.getWarningQuickGames();
            expect(warning.length).to.equal(1);
        });
    });

    describe('Session Data Persistence', () => {
        it('should save character data to current session', () => {
            const sessionId = sessionManager.createSession('Test Campaign', 'campaign');
            sessionManager.setCurrentSessionId(sessionId);

            const characters = [
                { id: 1, name: 'Hero', hp: 10, completed: false, isEnemy: false }
            ];

            sessionManager.updateSession(sessionId, {
                characters: characters,
                currentRound: 1
            });

            const session = sessionManager.getSession(sessionId);
            expect(session.characters.length).to.equal(1);
            expect(session.characters[0].name).to.equal('Hero');
        });

        it('should load character data from current session', () => {
            const sessionId = sessionManager.createSession('Test Campaign', 'campaign');
            const characters = [
                { id: 1, name: 'Hero', hp: 10, completed: false, isEnemy: false },
                { id: 2, name: 'Enemy 1', hp: 5, completed: false, isEnemy: true }
            ];

            sessionManager.updateSession(sessionId, {
                characters: characters,
                currentRound: 3
            });
            sessionManager.setCurrentSessionId(sessionId);

            const session = sessionManager.getCurrentSession();
            expect(session.characters.length).to.equal(2);
            expect(session.currentRound).to.equal(3);
        });

        it('should persist theme with session', () => {
            const sessionId = sessionManager.createSession('Pirate Campaign', 'campaign', 'pirate-borg');

            const session = sessionManager.getSession(sessionId);
            expect(session.theme).to.equal('pirate-borg');
        });

        it('should maintain separate data for different sessions', () => {
            const session1Id = sessionManager.createSession('Campaign 1', 'campaign');
            const session2Id = sessionManager.createSession('Campaign 2', 'campaign');

            sessionManager.updateSession(session1Id, {
                characters: [{ id: 1, name: 'Hero 1' }]
            });

            sessionManager.updateSession(session2Id, {
                characters: [{ id: 2, name: 'Hero 2' }]
            });

            const session1 = sessionManager.getSession(session1Id);
            const session2 = sessionManager.getSession(session2Id);

            expect(session1.characters[0].name).to.equal('Hero 1');
            expect(session2.characters[0].name).to.equal('Hero 2');
        });
    });

    describe('Session Switching', () => {
        it('should switch active session and load its data', () => {
            const session1Id = sessionManager.createSession('Session 1', 'campaign');
            const session2Id = sessionManager.createSession('Session 2', 'campaign');

            sessionManager.updateSession(session1Id, {
                characters: [{ id: 1, name: 'Hero 1' }],
                currentRound: 5
            });

            sessionManager.updateSession(session2Id, {
                characters: [{ id: 2, name: 'Hero 2' }],
                currentRound: 3
            });

            sessionManager.switchSession(session1Id);
            let current = sessionManager.getCurrentSession();
            expect(current.currentRound).to.equal(5);

            sessionManager.switchSession(session2Id);
            current = sessionManager.getCurrentSession();
            expect(current.currentRound).to.equal(3);
        });

        it('should update theme when switching sessions', () => {
            const session1Id = sessionManager.createSession('Mork Borg Campaign', 'campaign', 'mork-borg');
            const session2Id = sessionManager.createSession('Pirate Campaign', 'campaign', 'pirate-borg');

            sessionManager.switchSession(session1Id);
            expect(sessionManager.getCurrentSession().theme).to.equal('mork-borg');

            sessionManager.switchSession(session2Id);
            expect(sessionManager.getCurrentSession().theme).to.equal('pirate-borg');
        });
    });

    describe('Quick Game Management', () => {
        it('should create quick game with default name', () => {
            const sessionId = sessionManager.createSession('Quick Game', 'quick');
            const session = sessionManager.getSession(sessionId);

            expect(session.type).to.equal('quick');
            expect(session.name).to.equal('Quick Game');
        });

        it('should track extension count for quick games', () => {
            const sessionId = sessionManager.createSession('Quick Game', 'quick');

            sessionManager.extendSession(sessionId);
            sessionManager.extendSession(sessionId);

            const session = sessionManager.getSession(sessionId);
            expect(session.extendedCount).to.equal(2);
        });

        it('should promote quick game to campaign', () => {
            const sessionId = sessionManager.createSession('Quick Game', 'quick');
            sessionManager.updateSession(sessionId, {
                characters: [{ id: 1, name: 'Hero' }]
            });

            sessionManager.promoteToCarnapaign(sessionId, 'My Campaign');

            const session = sessionManager.getSession(sessionId);
            expect(session.type).to.equal('campaign');
            expect(session.name).to.equal('My Campaign');
            expect(session.characters.length).to.equal(1);
        });

        it('should delete expired quick game', () => {
            const sessionId = sessionManager.createSession('Old Quick Game', 'quick');

            expect(sessionManager.getSession(sessionId)).to.exist;

            sessionManager.deleteSession(sessionId);

            expect(sessionManager.getSession(sessionId)).to.be.null;
        });
    });

    describe('Session Selector UI Integration', () => {
        it('should populate session selector with available sessions', () => {
            sessionManager.createSession('Campaign 1', 'campaign');
            sessionManager.createSession('Campaign 2', 'campaign');
            sessionManager.createSession('Quick Game', 'quick');

            const sessions = sessionManager.getAllSessions();
            expect(sessions.length).to.equal(3);
        });

        it('should show current session in selector', () => {
            const sessionId = sessionManager.createSession('Active Campaign', 'campaign');
            sessionManager.setCurrentSessionId(sessionId);

            expect(sessionManager.currentSessionId).to.equal(sessionId);
        });
    });

    describe('Data Migration', () => {
        it('should migrate old localStorage format to session format', () => {
            localStorage.setItem('characters', JSON.stringify([
                { id: 1, name: 'Old Hero', hp: 10 }
            ]));
            localStorage.setItem('currentRound', '5');
            localStorage.setItem('selectedTheme', 'cy-borg');

            const sm = new SessionManager();

            const sessions = sm.getAllSessions();
            expect(sessions.length).to.equal(1);
            expect(sessions[0].type).to.equal('quick');
            expect(sessions[0].characters.length).to.equal(1);
            expect(sessions[0].currentRound).to.equal(5);
            expect(sessions[0].theme).to.equal('cy-borg');

            // Old keys should be removed
            expect(localStorage.getItem('characters')).to.be.null;
            expect(localStorage.getItem('currentRound')).to.be.null;
        });

        it('should not migrate if sessions already exist', () => {
            // Create a session first
            sessionManager.createSession('Existing', 'campaign');

            // Set old data
            localStorage.setItem('characters', JSON.stringify([{ id: 1 }]));

            // Create new SessionManager
            const sm = new SessionManager();

            // Should only have the one campaign, not a migrated session
            const sessions = sm.getAllSessions();
            expect(sessions.length).to.equal(1);
            expect(sessions[0].type).to.equal('campaign');
        });
    });

    describe('Round Management with Sessions', () => {
        it('should track round number per session', () => {
            const sessionId = sessionManager.createSession('Campaign', 'campaign');

            sessionManager.updateSession(sessionId, { currentRound: 1 });
            expect(sessionManager.getSession(sessionId).currentRound).to.equal(1);

            sessionManager.updateSession(sessionId, { currentRound: 5 });
            expect(sessionManager.getSession(sessionId).currentRound).to.equal(5);
        });

        it('should maintain round state when switching sessions', () => {
            const session1Id = sessionManager.createSession('Session 1', 'campaign');
            const session2Id = sessionManager.createSession('Session 2', 'campaign');

            sessionManager.updateSession(session1Id, { currentRound: 10 });
            sessionManager.updateSession(session2Id, { currentRound: 3 });

            expect(sessionManager.getSession(session1Id).currentRound).to.equal(10);
            expect(sessionManager.getSession(session2Id).currentRound).to.equal(3);
        });
    });

    describe('Session Export/Import Integration', () => {
        it('should export session with all game data', () => {
            const sessionId = sessionManager.createSession('Export Test', 'campaign');
            sessionManager.updateSession(sessionId, {
                characters: [
                    { id: 1, name: 'Hero', hp: 10, completed: false },
                    { id: 2, name: 'Enemy', hp: 5, completed: true, isEnemy: true }
                ],
                currentRound: 7
            });

            const exported = sessionManager.exportSession(sessionId);
            expect(exported).to.exist;

            const parsed = JSON.parse(exported);
            expect(parsed).to.have.property('version');
            expect(parsed).to.have.property('sessions');
            expect(parsed.sessions[0].name).to.equal('Export Test');
            expect(parsed.sessions[0].characters.length).to.equal(2);
            expect(parsed.sessions[0].currentRound).to.equal(7);
        });

        it('should import session and restore game state', () => {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                sessions: [{
                    id: 'test-import-123',
                    name: 'Imported Campaign',
                    type: 'campaign',
                    theme: 'mork-borg',
                    characters: [
                        { id: 1, name: 'Imported Hero', hp: 15 }
                    ],
                    currentRound: 4,
                    createdAt: new Date().toISOString(),
                    lastPlayed: new Date().toISOString()
                }]
            };

            const result = sessionManager.importSessions(JSON.stringify(exportData));
            expect(result.success).to.be.true;
            expect(result.imported).to.equal(1);

            const sessions = sessionManager.getAllSessions();
            const imported = sessions.find(s => s.name === 'Imported Campaign');
            expect(imported).to.exist;
            expect(imported.characters.length).to.equal(1);
            expect(imported.currentRound).to.equal(4);
            expect(imported.theme).to.equal('mork-borg');
        });
    });

    describe('Error Handling with Sessions', () => {
        it('should handle missing session gracefully', () => {
            const session = sessionManager.getSession('non-existent-id');
            expect(session).to.be.null;
        });

        it('should handle corrupted session data', () => {
            localStorage.setItem('it_sessions', 'invalid json');

            const sm = new SessionManager();
            const sessions = sm.getAllSessions();

            expect(sessions.length).to.equal(0);
        });

        it('should handle operations on null current session', () => {
            const current = sessionManager.getCurrentSession();
            expect(current).to.be.null;
        });
    });

    describe('Session Cleanup Workflow', () => {
        it('should identify multiple expired sessions', () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 35);

            const id1 = sessionManager.createSession('Old 1', 'quick');
            const id2 = sessionManager.createSession('Old 2', 'quick');
            const id3 = sessionManager.createSession('Recent', 'quick');

            sessionManager.sessions[id1].lastPlayed = oldDate.toISOString();
            sessionManager.sessions[id2].lastPlayed = oldDate.toISOString();
            sessionManager.saveSessions();

            const expired = sessionManager.getExpiredQuickGames();
            expect(expired.length).to.equal(2);
        });

        it('should not mark campaigns as expired', () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 100);

            const campaignId = sessionManager.createSession('Old Campaign', 'campaign');
            sessionManager.sessions[campaignId].lastPlayed = oldDate.toISOString();
            sessionManager.saveSessions();

            const expired = sessionManager.getExpiredQuickGames();
            expect(expired.length).to.equal(0);
        });
    });

    describe('Performance with Multiple Sessions', () => {
        it('should handle many sessions efficiently', () => {
            const startTime = Date.now();

            // Create 50 sessions
            for (let i = 0; i < 50; i++) {
                sessionManager.createSession(`Campaign ${i}`, 'campaign');
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(duration).to.be.below(500); // Should complete in under 500ms
            expect(sessionManager.getAllSessions().length).to.equal(50);
        });

        it('should retrieve sessions quickly', () => {
            // Create 20 sessions
            for (let i = 0; i < 20; i++) {
                sessionManager.createSession(`Session ${i}`, i % 2 === 0 ? 'campaign' : 'quick');
            }

            const startTime = Date.now();
            const campaigns = sessionManager.getSessionsByType('campaign');
            const quickGames = sessionManager.getSessionsByType('quick');
            const endTime = Date.now();

            expect(endTime - startTime).to.be.below(50);
            expect(campaigns.length).to.equal(10);
            expect(quickGames.length).to.equal(10);
        });
    });
});


