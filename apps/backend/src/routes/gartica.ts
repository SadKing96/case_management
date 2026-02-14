import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { complianceService } from '../services/compliance';

const router = Router();
const prisma = new PrismaClient();

console.log("Loading Gartica Routes...");

router.get('/ping', (req, res) => {
    console.log("Gartica Ping Hit!");
    res.json({ message: 'pong', timestamp: new Date() });
});


// Mock Data for Gartica Dashboard

// Capacity Forecasting (Moved to top for debugging)
// Capacity Forecasting (Employee & Pipeline Focused)
router.get('/capacity/forecast', async (req, res) => {
    try {
        const horizon = parseInt(req.query.horizon as string) || 30;

        // 1. Mock Employees & Productivity
        const employees = [
            { id: 'u1', name: 'Sarah Connor', role: 'Senior Case Manager', productivityScore: 92, capacity: 20 }, // Can handle 20 cases/day
            { id: 'u2', name: 'John Smith', role: 'Support Agent', productivityScore: 78, capacity: 15 },
            { id: 'u3', name: 'Emily Chen', role: 'Technical Lead', productivityScore: 95, capacity: 18 }, // Lower capacity due to lead duties, but high score
            { id: 'u4', name: 'Michael Brown', role: 'Case Manager', productivityScore: 65, capacity: 15 },
            { id: 'u5', name: 'Jessica Davis', role: 'Support Agent', productivityScore: 88, capacity: 15 },
        ];

        // Calculate Total Team Daily Capacity (Weighted by Productivity)
        // Effective Capacity = Base Capacity * (Productivity / 100)
        const teamDailyCapacity = employees.reduce((sum, emp) => {
            return sum + (emp.capacity * (emp.productivityScore / 100));
        }, 0);

        // 2. Mock Sales Pipeline (CRM Integration)
        const pipelineDeals = [
            { id: 'd1', name: 'Enterprise Renewal - Globex', probability: 0.9, closeDate: 5, volumeImpact: 10 }, // closeDate = days from now
            { id: 'd2', name: 'New Logo - Cyberdyne', probability: 0.6, closeDate: 15, volumeImpact: 25 },
            { id: 'd3', name: 'Expansion - Acme Corp', probability: 0.8, closeDate: 25, volumeImpact: 15 },
            { id: 'd4', name: 'New Logo - Wayne Ent', probability: 0.4, closeDate: 40, volumeImpact: 30 },
        ];

        // 3. Generate Forecast
        const dates: string[] = [];
        const projectedWorkload: number[] = [];
        const teamCapacityLine: number[] = [];

        let currentBaseVolume = 55; // Starting daily volume

        const today = new Date();

        for (let i = 0; i < horizon; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i + 1);
            dates.push(d.toISOString().split('T')[0]);

            // Base growth
            currentBaseVolume = currentBaseVolume * 1.002;

            // Add Pipeline Impact
            let pipelineAdd = 0;
            pipelineDeals.forEach(deal => {
                if (i >= deal.closeDate) {
                    // Deal has closed, add volume weighted by probability
                    pipelineAdd += (deal.volumeImpact * deal.probability);
                }
            });

            // Noise
            const noise = (Math.random() - 0.5) * 5;

            const totalLoad = currentBaseVolume + pipelineAdd + noise;
            projectedWorkload.push(Math.round(totalLoad));

            // Capacity Line (constant for now, could fluctuate with weekends/holidays)
            teamCapacityLine.push(Math.round(teamDailyCapacity));
        }

        // 4. AI Insights
        const maxLoad = Math.max(...projectedWorkload);
        const capacity = Math.round(teamDailyCapacity);
        let insight = "Team capacity is sufficient for the projected horizon.";
        let severity = "low";

        if (maxLoad > capacity * 1.1) {
            insight = "Critical Alert: Projected workload exceeds capacity by >10% next month due to Cyberdyne deal.";
            severity = "high";
        } else if (maxLoad > capacity) {
            insight = "Warning: Team will be at full capacity starting in 2 weeks.";
            severity = "medium";
        }

        res.json({
            employees,
            pipelineDeals,
            forecast: {
                dates,
                projectedWorkload,
                teamCapacity: teamCapacityLine,
            },
            aiInsight: {
                text: insight,
                severity
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate forecast' });
    }
});

// Customer 360 (Moved to top)
router.get('/customer-360', async (req, res) => {
    try {
        // Mock Enterprise Customers
        const customers = [
            { id: 'c1', name: 'Acme Corp', revenue: '$1.2M', healthScore: 92, churnRisk: 'Low', openCases: 2, sentiment: 'Positive' },
            { id: 'c2', name: 'Globex Inc', revenue: '$850k', healthScore: 45, churnRisk: 'High', openCases: 14, sentiment: 'Negative' },
            { id: 'c3', name: 'Soylent Corp', revenue: '$2.1M', healthScore: 78, churnRisk: 'Low', openCases: 5, sentiment: 'Neutral' },
            { id: 'c4', name: 'Initech', revenue: '$500k', healthScore: 30, churnRisk: 'Critical', openCases: 8, sentiment: 'Negative' },
            { id: 'c5', name: 'Umbrella Corp', revenue: '$5.5M', healthScore: 65, churnRisk: 'Medium', openCases: 12, sentiment: 'Neutral' },
            { id: 'c6', name: 'Stark Ind', revenue: '$10M', healthScore: 98, churnRisk: 'Low', openCases: 0, sentiment: 'Positive' },
            { id: 'c7', name: 'Cyberdyne', revenue: '$3.2M', healthScore: 55, churnRisk: 'Medium', openCases: 7, sentiment: 'Negative' },
            { id: 'c8', name: 'Wayne Ent', revenue: '$4.1M', healthScore: 88, churnRisk: 'Low', openCases: 3, sentiment: 'Positive' },
        ];

        // Enrich with mock AI insights
        const enriched = customers.map(c => ({
            ...c,
            insights: c.churnRisk === 'High' || c.churnRisk === 'Critical'
                ? ['Frequent rigid SLA breaches', 'Negative sentiment in last 3 emails', 'Decrease in comprehensive platform usage']
                : ['Healthy engagement', 'Recent contract renewal', 'High feature adoption']
        }));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: 'Customer 360 failed' });
    }
});


router.get('/insights', async (req, res) => {
    // In a real implementation, this would query the GarticaInsight model
    // or run an AI analysis on recent emails.
    // For now, we return mock data.

    const insights = [
        {
            id: '1',
            type: 'anomaly',
            severity: 'high',
            title: 'Unusual Order Volume from Apex Ind.',
            description: 'Customer Apex Industries has submitted 5 large orders in the last hour, deviating from their monthly average.',
            timestamp: new Date().toISOString()
        },
        {
            id: '2',
            type: 'sentiment',
            severity: 'medium',
            title: 'Frustration detected in "Project X" thread',
            description: 'Email thread with subject "Project X delays" shows multiple negative sentiment markers from the client.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
            id: '3',
            type: 'performance',
            severity: 'low',
            title: 'Response Time Lag',
            description: 'Average response time for Team Alpha has increased by 15% this week.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        }
    ];

    res.json(insights);
});

router.get('/stats', async (req, res) => {
    res.json({
        activeAnomalies: 3,
        monitoredEmails: 1245,
        resolutionRate: 98.5,
        customerSentimentScore: 7.2 // out of 10
    });
});

router.get('/performance', async (req, res) => {
    // Mock AI Analysis of Employee Performance
    const performanceData = [
        {
            id: 'u1',
            name: 'Sarah Connor',
            role: 'Senior Case Manager',
            productivityScore: 92, // 0-100
            productivityTrend: 'up', // 'up' | 'down' | 'stable'
            sentimentScore: 8.5, // 0-10
            anomalies: 0,
            aiInsight: 'Consistently high resolution rate; effective client communication.',
            avatar: 'SC'
        },
        {
            id: 'u2',
            name: 'John Smith',
            role: 'Support Agent',
            productivityScore: 78,
            productivityTrend: 'stable',
            sentimentScore: 6.2,
            anomalies: 1,
            aiInsight: 'Detected potential burnout tone in late-night replies.',
            avatar: 'JS'
        },
        {
            id: 'u3',
            name: 'Emily Chen',
            role: 'Technical Lead',
            productivityScore: 95,
            productivityTrend: 'up',
            sentimentScore: 9.0,
            anomalies: 0,
            aiInsight: 'Leading team technically; excellent code review feedback detected.',
            avatar: 'EC'
        },
        {
            id: 'u4',
            name: 'Michael Brown',
            role: 'Case Manager',
            productivityScore: 65,
            productivityTrend: 'down',
            sentimentScore: 5.5,
            anomalies: 2,
            aiInsight: 'Productivity drop correlated with high strictness in email tone.',
            avatar: 'MB'
        }
    ];

    res.json({
        teamMetrics: {
            averageProductivity: 82.5,
            burnoutRisk: 'Low',
            engagementScore: 7.8
        },
        employees: performanceData
    });
});



// Aftermarket Routes
router.get('/aftermarket/summary', async (req, res) => {
    try {
        // Real DB Query
        // 1. Total Opportunity
        const assets = await (prisma as any).aftermarketAsset.findMany(); // using any due to potential type lag

        const totalOpportunity = assets.reduce((sum: number, a: any) => sum + (a.revenuePotential || 0), 0);

        // 2. High Priority (Health < 50)
        const highPriorityAssets = assets.filter((a: any) => a.healthScore < 50);

        // 3. Next Best Actions (Top 5 Opportunities)
        const topOpps = [...assets]
            .sort((a: any, b: any) => b.revenuePotential - a.revenuePotential)
            .slice(0, 5)
            .map((a: any) => ({
                id: a.id,
                customer: a.customerName,
                action: a.aiPrediction ? `Address: ${a.aiPrediction}` : 'Schedule Preventative Maintenance',
                potential: a.revenuePotential,
                model: a.model,
                health: a.healthScore
            }));

        res.json({
            totalOpportunity,
            highPriorityTargets: highPriorityAssets.length,
            winRateProjection: 65, // Keep static or calc based on history if available
            nextBestActions: topOpps
        });
    } catch (err) {
        console.error("Aftermarket summary error:", err);
        res.status(500).json({ error: "Failed to fetch aftermarket summary" });
    }
});

// New Endpoint for the List View
router.get('/aftermarket/assets', async (req, res) => {
    try {
        const assets = await (prisma as any).aftermarketAsset.findMany({
            orderBy: { revenuePotential: 'desc' },
            take: 50
        });
        res.json(assets);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch assets" });
    }
});



// Daily Activity
router.get('/daily-activity', async (req, res) => {
    try {
        const { date } = req.query;
        // Parse date reliably, handle if it's just YYYY-MM-DD
        const parseDate = (d: string) => {
            const parts = d.split('-');
            if (parts.length === 3) {
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            return new Date(d);
        };

        const targetDate = date ? parseDate(String(date)) : new Date();

        // Set start and end of day (UTC or Local? Server likely UTC, let's stick to simple day boundaries)
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch all users
        const users = await prisma.user.findMany({
            where: { isActive: true },
            select: { id: true, name: true, email: true, roles: true }
        });

        // Parallelize stats gathering
        const activityStats = await Promise.all(users.map(async (user) => {
            const [emailsSent, notesAdded, casesClosed, casesCreated] = await Promise.all([
                // Emails Sent (from user's email)
                prisma.caseEmail.count({
                    where: {
                        direction: 'out',
                        from: { contains: user.email }, // Simple match
                        receivedAt: {
                            gte: startOfDay,
                            lte: endOfDay
                        }
                    }
                }),
                // Notes Added
                prisma.caseNote.count({
                    where: {
                        authorId: user.id,
                        createdAt: {
                            gte: startOfDay,
                            lte: endOfDay
                        }
                    }
                }),
                // Cases Closed (assigned to user)
                prisma.case.count({
                    where: {
                        assigneeId: user.id,
                        closedAt: {
                            gte: startOfDay,
                            lte: endOfDay
                        }
                    }
                }),
                // Cases Created (assigned to user)
                prisma.case.count({
                    where: {
                        assigneeId: user.id,
                        createdAt: {
                            gte: startOfDay,
                            lte: endOfDay
                        }
                    }
                })
            ]);

            return {
                id: user.id,
                name: user.name,
                role: user.roles, // Simplified
                stats: {
                    emailsSent,
                    notesAdded,
                    casesClosed,
                    casesCreated
                }
            };
        }));

        res.json(activityStats);

    } catch (error) {
        console.error('Error fetching daily activity:', error);
        res.status(500).json({ error: 'Failed to fetch daily activity' });
    }
});

router.post('/analyze-day', async (req, res) => {
    // Mock AI Analysis
    const { date, stats } = req.body;

    // In a real implementation:
    // 1. Construct prompt with `stats` JSON
    // 2. Call OpenAI/Gemini API
    // 3. Return response

    // Mock response
    const mockAnalysis = `
    ### Daily Summary (${date || 'Today'})
    
    Processing ${stats?.length || 0} employees.
    
    **Highlights:**
    - Email volume is **moderate**.
    - Case closure rate is **on track**.
    
    **Recommendations:**
    - Monitor "Cases Created" spikes for potential resource allocation needs.
    `;

    setTimeout(() => {
        res.json({ analysis: mockAnalysis });
    }, 1500); // Fake delay
});

// Capacity Forecasting moved to top


// Compliance Sentinel
router.get('/compliance/flags', async (req, res) => {
    try {
        const flags = await (prisma as any).complianceFlag.findMany({
            where: {
                status: 'open'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(flags);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch compliance flags' });
    }
});

router.post('/compliance/flags/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'resolved' or 'dismissed'

        await (prisma as any).complianceFlag.update({
            where: { id },
            data: { status: status || 'resolved', resolvedAt: new Date() }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update flag' });
    }
});

// Demo Helper: Trigger a scan manually
router.post('/compliance/scan-mock', async (req, res) => {
    try {
        const { text, type } = req.body;
        // Mock source ID
        const fakeId = 'mock-' + Date.now();
        await complianceService.scanContent(text, type || 'note', fakeId);
        res.json({ success: true, message: 'Scan triggered' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Scan failed' });
    }
});

// Knowledge Nexus
router.post('/knowledge/search', async (req, res) => {
    try {
        const { query } = req.body;

        // Simple mock semantic search
        // Find cases where title or description contains text
        const results = await prisma.case.findMany({
            where: {
                OR: [
                    { title: { contains: query as string } }, // Case insensitive usually depends on DB collation
                    { description: { contains: query as string } }
                ],
                closedAt: { not: null } // Closed cases have a closedAt date
            },
            take: 10,
            include: {
                assignee: { select: { name: true } }
            }
        });

        // Add mock similarity score
        const scoredResults = results.map(r => ({
            ...r,
            similarityScore: 0.7 + (Math.random() * 0.25) // Fake 0.70 - 0.95 score
        }));

        res.json(scoredResults);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Search failed' });
    }
});

router.post('/knowledge/suggest', async (req, res) => {
    try {
        const { query } = req.body;
        const lowerQ = (query as string).toLowerCase();

        let suggestion = "Based on the query, we recommend checking the standard operating procedures.";

        if (lowerQ.includes('password') || lowerQ.includes('reset') || lowerQ.includes('login')) {
            suggestion = "For authentication issues: \n1. Verify user status in Admin Panel.\n2. Trigger a password reset email.\n3. Check if SSO is down via Status Page.";
        } else if (lowerQ.includes('billing') || lowerQ.includes('invoice')) {
            suggestion = "For billing inquiries: \n1. Confirm invoice ID in ERP.\n2. Check payment terms (Net 30/60).\n3. Escalate to Finance if disputed > $1k.";
        } else if (lowerQ.includes('shipping') || lowerQ.includes('delay')) {
            suggestion = "For shipping delays: \n1. Check carrier tracking API.\n2. If stuck at customs, request TI-88 form.\n3. Offer 5% discount if delay > 5 days.";
        }

        setTimeout(() => {
            res.json({ suggestion });
        }, 800);
    } catch (err) {
        res.status(500).json({ error: 'Suggestion failed' });
    }
});

// Process Mining
router.get('/process/mining', async (req, res) => {
    try {
        // Mock Process Graph
        // In reality, this would aggregate `CaseHistory` table transitions
        const data = {
            nodes: [
                { id: 'open', label: 'Open', x: 50, y: 100 },
                { id: 'triage', label: 'Triage', x: 250, y: 100 },
                { id: 'working', label: 'In Progress', x: 450, y: 100 },
                { id: 'review', label: 'Code Review', x: 650, y: 100 },
                { id: 'done', label: 'Closed', x: 850, y: 100 },
            ],
            edges: [
                { source: 'open', target: 'triage', count: 1240, avgTime: '2h', isBottleneck: false },
                { source: 'triage', target: 'working', count: 1100, avgTime: '4h', isBottleneck: false },
                { source: 'working', target: 'review', count: 980, avgTime: '2d', isBottleneck: true }, // Bottleneck!
                { source: 'review', target: 'working', count: 340, avgTime: '1d', isBottleneck: false, isLoop: true }, // Rework loop
                { source: 'review', target: 'done', count: 640, avgTime: '4h', isBottleneck: false },
            ],
            metrics: {
                avgResolutionTime: '4.2 Days',
                loopRate: '34%', // % of tickets that go back from review to working
                efficiencyScore: 72
            }
        };

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Process mining failed' });
    }
});

// Customer 360 moved to top


// Operations Routes

router.get('/operations/metrics', async (req, res) => {
    // Mock KPIs
    res.json([
        { id: '1', label: 'On-Time Delivery', value: '94.2%', trend: 'up', status: 'good' },
        { id: '2', label: 'Inventory Accuracy', value: '99.8%', trend: 'stable', status: 'good' },
        { id: '3', label: 'Avg Shipping Time', value: '3.4d', trend: 'down', status: 'warning' }, // down is bad for time? Context dependent, assuming down means slower here or maybe it means improved? Let's assume red means bad.
        { id: '4', label: 'Backlog', value: '142', trend: 'down', status: 'good' }
    ]);
});

router.get('/operations/expedite', async (req, res) => {
    res.json([
        { id: 'e1', orderId: 'ORD-9921', customer: 'Globex Inc', delayReason: 'Weather Exception', daysDelayed: 2, priority: 80 },
        { id: 'e2', orderId: 'ORD-3321', customer: 'Acme Corp', delayReason: 'Component Shortage', daysDelayed: 5, priority: 95 },
        { id: 'e3', orderId: 'ORD-7712', customer: 'Soylent Corp', delayReason: 'Carrier Missort', daysDelayed: 1, priority: 40 },
    ]);
});

router.get('/operations/ai-status', async (req, res) => {
    // Mock AI "Thinking" Status
    const statuses = [
        "Optimizing Route 44 due to severe weather in Midwest.",
        "Detected potential supply bottleneck for 'Component A'. Suggesting alternative suppliers.",
        "Re-balancing inventory loads across regional distribution centers.",
        "Analyzing carrier performance patterns for Q1 negotiations."
    ];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    res.json({
        status: "Active Monitoring",
        summary: randomStatus
    });
});

export default router;
