import { apiClient } from '../api/client';
import { User } from '../../../../packages/shared/src/types';

// Types for our specific report requirements
export type ReportType =
    | 'USER_REPORT'
    | 'PRODUCTIVITY_REPORT'
    | 'TEAM_REPORT'
    | 'TRASH_REPORT'
    | 'CARDS_REPORT'
    | 'ARCHIVE_REPORT'
    | 'COUNT_DOWN_REPORT';

interface ReportConfig {
    id: ReportType;
    title: string;
    description: string;
    roles: string[]; // 'SuperUser', 'Admin', 'User'
}

export const REPORT_OPTIONS: ReportConfig[] = [
    // Admin Reports
    {
        id: 'USER_REPORT',
        title: 'User Report',
        description: 'Basic information associated with each user profile.',
        roles: ['SuperUser', 'Admin']
    },
    {
        id: 'PRODUCTIVITY_REPORT',
        title: 'Productivity Report',
        description: 'User performance metrics: assigned, closed early/on-time/late.',
        roles: ['SuperUser', 'Admin']
    },
    {
        id: 'TEAM_REPORT',
        title: 'Team Report',
        description: 'Current teams and assigned users.',
        roles: ['SuperUser', 'Admin']
    },
    // User Reports
    {
        id: 'TRASH_REPORT',
        title: 'Trash Deletion Report',
        description: 'Cards in trash, days until purge.',
        roles: ['SuperUser', 'Admin', 'User']
    },
    {
        id: 'CARDS_REPORT',
        title: 'Cards Report',
        description: 'Detailed list of active cards within the date range.',
        roles: ['SuperUser', 'Admin', 'User']
    },
    {
        id: 'ARCHIVE_REPORT',
        title: 'Archive Report',
        description: 'List of all archived cards.',
        roles: ['SuperUser', 'Admin', 'User']
    },
    {
        id: 'COUNT_DOWN_REPORT',
        title: 'Count Down Report',
        description: 'Days in current column, days remaining until due date.',
        roles: ['SuperUser', 'Admin', 'User']
    }
];

// Helper to format date for CSV
const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
};

// Helper to download CSV
export const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
        alert('No data to export for the selected range.');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(header => {
            const val = row[header];
            // Escape quotes and wrap in quotes if contains comma
            const stringVal = String(val === null || val === undefined ? '' : val);
            return `"${stringVal.replace(/"/g, '""')}"`;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Fetch and Generate Logic
export const generateReport = async (
    type: ReportType,
    startDate: string,
    endDate: string
) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Adjust end date to include the full day
    end.setHours(23, 59, 59, 999);

    const isDateInRange = (dateStr: string | Date | null | undefined) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= start && d <= end;
    };

    switch (type) {
        case 'USER_REPORT': {
            const users = await apiClient.get<any[]>('/users');
            // Filter? Usually User Report is a snapshot of CURRENT users, maybe filtered by creation date if strictly needed, 
            // but requirement says "shows basic info... essentially everything editable".
            // Let's dump all users for now as it's a "User Report" snapshot.

            const data = users.map(u => ({
                ID: u.id,
                Name: u.name,
                Email: u.email,
                Roles: u.roles.join(', '),
                Status: u.isActive ? 'Active' : 'Inactive',
                Created: formatDate(u.createdAt)
            }));
            downloadCSV(data, 'User_Report');
            break;
        }

        case 'PRODUCTIVITY_REPORT': {
            // Need users and their closed cases?
            // This is complex without a dedicated endpoint for historical agg.
            // We will fetch ALL cases (including closed) and aggregate.
            // Note: This relies on fetching A LOT of data depending on system size.

            const [users, allCases] = await Promise.all([
                apiClient.get<any[]>('/users'),
                apiClient.get<any[]>('/cases?active=false') // Ensure we get closed ones too. Note: need to ensure backend supports listing CLOSED cases.
            ]);

            // Filter cases by CLOSED date within range
            const closedInCases = allCases.filter((c: any) => c.closedAt && isDateInRange(c.closedAt));
            const activeCases = allCases.filter((c: any) => !c.closedAt && !c.deletedAt && !c.archivedAt);

            const data = users.map(u => {
                const userCases = closedInCases.filter((c: any) => c.assigneeId === u.id);
                const currentAssigned = activeCases.filter((c: any) => c.assigneeId === u.id).length;

                let closedEarly = 0;
                let closedOnTime = 0;
                let closedLate = 0;

                userCases.forEach((c: any) => {
                    if (!c.opdsl) {
                        closedOnTime++; // No due date = on time? or N/A. Let's count as on time for now.
                        return;
                    }
                    const due = new Date(c.opdsl);
                    const closed = new Date(c.closedAt);

                    // Simple day comparison
                    const dueDay = new Date(due.toDateString());
                    const closedDay = new Date(closed.toDateString());

                    if (closedDay < dueDay) closedEarly++;
                    else if (closedDay > dueDay) closedLate++;
                    else closedOnTime++;
                });

                return {
                    User: u.name,
                    Email: u.email,
                    'Currently Assigned': currentAssigned,
                    'Closed Early': closedEarly,
                    'Closed On Time': closedOnTime,
                    'Closed Late': closedLate,
                    'Total Closed (Range)': userCases.length
                };
            });
            downloadCSV(data, 'Productivity_Report');
            break;
        }

        case 'TEAM_REPORT': {
            // Mocking teams as we might not have a full team endpoint or it's embedded in users
            // Requirement: "shows any current teams and the users assigned to it"
            // Assuming users have a 'teaams' property or we have a /teams endpoint.
            // Impl plan mentioned /users. Let's try to infer from users for now if teams don't exist as robust entity.
            // Actually, looking at `UserWithDetails` in `api/users.ts`, it has `teams`.

            const users = await apiClient.get<any[]>('/users');
            const flatData: any[] = [];

            users.forEach(u => {
                if (u.teams && u.teams.length > 0) {
                    u.teams.forEach((t: any) => {
                        flatData.push({
                            Team: t.team.name,
                            UserName: u.name,
                            UserEmail: u.email
                        });
                    });
                } else {
                    // Users with no team? Optional.
                }
            });

            downloadCSV(flatData.sort((a, b) => a.Team.localeCompare(b.Team)), 'Team_Report');
            break;
        }

        case 'TRASH_REPORT': {
            const trashCases = await apiClient.get<any[]>('/cases/trash/all');
            const data = trashCases.map(c => {
                const deletedDate = new Date(c.deletedAt);
                const purgeDate = new Date(deletedDate);
                purgeDate.setDate(deletedDate.getDate() + 30); // 30 day auto purge policy

                const daysUntilPurge = Math.ceil((purgeDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                return {
                    ID: c.id,
                    Title: c.title,
                    'Deleted Date': formatDate(c.deletedAt),
                    'Days Until Purge': daysUntilPurge > 0 ? daysUntilPurge : 0,
                    'Purge Date': formatDate(purgeDate)
                };
            });
            downloadCSV(data, 'Trash_Deletion_Report');
            break;
        }

        case 'CARDS_REPORT': {
            // "Essentially the cards section table"
            const cases = await apiClient.get<any[]>('/cases?active=true');
            // Check date range? "created within range"? or "active within range"?
            // Usually reports ask for "Show me cards created between X and Y" OR "Closed between X and Y".
            // Let's assume CREATED for a general "Cards Report" unless otherwise specified.

            const filtered = cases.filter(c => isDateInRange(c.createdAt));

            const data = filtered.map(c => ({
                ID: c.id,
                Title: c.title,
                Board: c.board?.name,
                Column: c.column?.name,
                Assignee: c.assignee?.name || 'Unassigned',
                Priority: c.priority,
                Created: formatDate(c.createdAt),
                Due: formatDate(c.opdsl)
            }));
            downloadCSV(data, 'Cards_Report');
            break;
        }

        case 'ARCHIVE_REPORT': {
            // Need to fetch archived cases. The current /cases endpoint might filter them out.
            // We saw /cases takes `active=true` (excludes closed/archived) or `active=false` (includes them?).
            // backend cases.ts: if (isActive) where.closedAt = null; where.archivedAt = null;
            // if active is NOT true, it doesn't strictly Filter BY archived.
            // We might need to fetch ALL and filter for `archivedAt != null`.

            const allCases = await apiClient.get<any[]>('/cases?active=false');
            const archived = allCases.filter((c: any) => c.archivedAt !== null && isDateInRange(c.archivedAt));

            const data = archived.map(c => ({
                ID: c.id,
                Title: c.title,
                'Archived Date': formatDate(c.archivedAt),
                Board: c.board?.name,
                Assignee: c.assignee?.name || 'Unassigned'
            }));
            downloadCSV(data, 'Archive_Report');
            break;
        }

        case 'COUNT_DOWN_REPORT': {
            // "shows each card and how long its been in its current column in days... days remain until due date... due date"
            const cases = await apiClient.get<any[]>('/cases?active=true');

            const data = cases.map(c => {
                // Time in column is tricky without an audit log of strictly "entered current column".
                // As a proxy, we use `updatedAt`. If the card was moved, updatedAt changes.
                // It's imperfect (editing title also updates it) but best we have without granular logs.
                // OR we can leave it blank/mocked if strictly required. 
                // Let's use Last Updated as proxy for "Time in Stage" for now.

                const daysInColumn = Math.floor((new Date().getTime() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24));

                let daysRemaining = '';
                if (c.opdsl) {
                    const due = new Date(c.opdsl);
                    const diffTime = due.getTime() - new Date().getTime();
                    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24)).toString();
                }

                return {
                    ID: c.id,
                    Title: c.title,
                    Column: c.column?.name,
                    'Days in Column (Since Last Update)': daysInColumn,
                    'Days Until Due': daysRemaining,
                    'Due Date': formatDate(c.opdsl)
                };
            });
            downloadCSV(data, 'Count_Down_Report');
            break;
        }
    }
};
