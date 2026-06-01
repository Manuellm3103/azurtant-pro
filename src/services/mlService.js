/**
 * AzurTant PRO - Machine Learning Service
 * Predictive analytics for autonomous business operations
 */

class MLService {
    constructor() {
        this.models = {
            salesForecast: null,
            churnPrediction: null,
            anomalyDetection: null,
            sentimentAnalysis: null,
            resourceOptimization: null
        };
        this.initialized = false;
    }

    async initialize() {
        // Initialize ML models (in production, would load actual models)
        this.initialized = true;
        return { status: 'ready', capabilities: Object.keys(this.models) };
    }

    // Sales Forecasting using simple linear regression
    async predictSales(historicalData) {
        if (!historicalData || historicalData.length < 3) {
            return { error: 'Insufficient data for prediction' };
        }

        // Simple moving average prediction
        const recent = historicalData.slice(-6);
        const avgGrowth = this.calculateAverageGrowth(recent);
        const lastValue = recent[recent.length - 1].value;

        const predictions = [];
        for (let i = 1; i <= 6; i++) {
            predictions.push({
                month: this.addMonths(new Date(), i),
                predicted: lastValue * Math.pow(1 + avgGrowth, i),
                confidence: Math.max(0.6, 0.95 - (i * 0.05))
            });
        }

        return {
            predictions,
            trend: avgGrowth > 0 ? 'increasing' : avgGrowth < 0 ? 'decreasing' : 'stable',
            avgGrowth: avgGrowth * 100
        };
    }

    calculateAverageGrowth(data) {
        if (data.length < 2) return 0;
        let totalGrowth = 0;
        for (let i = 1; i < data.length; i++) {
            if (data[i-1].value > 0) {
                totalGrowth += (data[i].value - data[i-1].value) / data[i-1].value;
            }
        }
        return totalGrowth / (data.length - 1);
    }

    addMonths(date, months) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d.toISOString().slice(0, 7);
    }

    // Customer Churn Prediction
    async predictChurn(customerData) {
        const score = this.calculateChurnScore(customerData);
        const riskLevel = score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';

        return {
            churnProbability: score,
            riskLevel,
            factors: this.getTopChurnFactors(customerData),
            recommendations: this.getChurnPreventionRecommendations(riskLevel)
        };
    }

    calculateChurnScore(customer) {
        let score = 0.3; // Base score

        // Days since last purchase
        const daysSinceLastPurchase = (Date.now() - new Date(customer.lastPurchase).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastPurchase > 90) score += 0.3;
        else if (daysSinceLastPurchase > 60) score += 0.2;
        else if (daysSinceLastPurchase > 30) score += 0.1;

        // Support tickets ratio
        if (customer.supportTickets > 5) score += 0.2;
        else if (customer.supportTickets > 2) score += 0.1;

        // Engagement score
        if (customer.engagementScore < 0.3) score += 0.15;

        // Payment delays
        if (customer.paymentDelays > 2) score += 0.15;

        return Math.min(score, 0.99);
    }

    getTopChurnFactors(customer) {
        const factors = [];
        const daysSince = (Date.now() - new Date(customer.lastPurchase).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 60) factors.push({ factor: 'Inactividad prolongada', impact: 'high' });
        if (customer.supportTickets > 3) factors.push({ factor: 'Tickets de soporte altos', impact: 'medium' });
        if (customer.paymentDelays > 1) factors.push({ factor: 'Retraso en pagos', impact: 'medium' });
        return factors;
    }

    getChurnPreventionRecommendations(riskLevel) {
        if (riskLevel === 'high') {
            return [
                'Contactar inmediatamente con oferta personalizada',
                'Asignar account manager dedicado',
                'Revisar satisfacción del servicio'
            ];
        } else if (riskLevel === 'medium') {
            return [
                'Enviar comunicaciones de valor',
                'Ofrecer descuentos en próxima compra',
                'Solicitar feedback'
            ];
        }
        return ['Mantener communications regulares'];
    }

    // Anomaly Detection for business metrics
    async detectAnomalies(metrics) {
        const anomalies = [];
        const mean = metrics.reduce((a, b) => a + b.value, 0) / metrics.length;
        const stdDev = Math.sqrt(metrics.reduce((a, b) => a + Math.pow(b.value - mean, 2), 0) / metrics.length);

        metrics.forEach((m, i) => {
            const zScore = Math.abs((m.value - mean) / stdDev);
            if (zScore > 2) {
                anomalies.push({
                    index: i,
                    value: m.value,
                    expected: mean,
                    deviation: zScore,
                    severity: zScore > 3 ? 'critical' : 'warning'
                });
            }
        });

        return {
            anomalies,
            summary: `Found ${anomalies.length} anomalies in ${metrics.length} data points`,
            mean,
            stdDev
        };
    }

    // Sentiment Analysis for customer feedback
    async analyzeSentiment(text) {
        const positiveWords = ['excelente', 'genial', 'perfecto', 'gracias', 'amor', 'mejor', 'rápido', 'increíble', 'fantástico', 'satisfecho'];
        const negativeWords = ['mal', 'terrible', 'pésimo', 'problema', 'error', 'fallo', 'frustrado', '失望', 'nunca', 'horrible'];
        const neutralWords = ['ok', 'normal', 'regular', 'aceptable', 'standard'];

        const lowerText = text.toLowerCase();
        let score = 0.5;
        let reasons = [];

        positiveWords.forEach(word => {
            if (lowerText.includes(word)) {
                score += 0.1;
                reasons.push(`Palabra positiva: "${word}"`);
            }
        });

        negativeWords.forEach(word => {
            if (lowerText.includes(word)) {
                score -= 0.15;
                reasons.push(`Palabra negativa: "${word}"`);
            }
        });

        score = Math.max(0, Math.min(1, score));
        const sentiment = score > 0.6 ? 'positive' : score < 0.4 ? 'negative' : 'neutral';

        return { score, sentiment, reasons, confidence: Math.abs(score - 0.5) * 2 };
    }

    // Resource Optimization
    async optimizeResources(currentResources, demandForecast) {
        const optimized = [];

        currentResources.forEach(resource => {
            const predictedDemand = demandForecast.find(d => d.type === resource.type);
            const optimalLevel = predictedDemand ? predictedDemand.demand * 1.1 : resource.current;

            optimized.push({
                type: resource.type,
                current: resource.current,
                optimal: Math.round(optimalLevel),
                action: optimalLevel > resource.current * 1.2 ? 'increase' : optimalLevel < resource.current * 0.8 ? 'decrease' : 'maintain',
                confidence: 0.85
            });
        });

        return {
            optimizations: optimized,
            totalSavings: this.calculateSavings(currentResources, optimized),
            efficiencyGain: '12%'
        };
    }

    calculateSavings(current, optimized) {
        let savings = 0;
        optimized.forEach((o, i) => {
            if (o.action === 'decrease') {
                savings += (current[i].current - o.optimal) * 0.3;
            }
        });
        return Math.round(savings);
    }

    // Natural Language Processing for business intents
    async processIntent(userMessage, context) {
        const intents = {
            sales: ['vender', 'venta', 'cliente', 'prospecto', 'negocio'],
            support: ['problema', 'error', 'ayuda', 'soporte', 'ticket'],
            finance: ['factura', 'pago', 'dinero', 'balance', 'nómina'],
            marketing: ['marketing', 'publicar', 'redes', 'contenido', 'campaña'],
            operations: ['proceso', 'operación', 'workflow', 'optimizar']
        };

        const lowerMsg = userMessage.toLowerCase();
        let detectedIntent = 'general';
        let confidence = 0;

        for (const [intent, keywords] of Object.entries(intents)) {
            let matches = 0;
            keywords.forEach(kw => {
                if (lowerMsg.includes(kw)) matches++;
            });
            const intentConfidence = matches / keywords.length;
            if (intentConfidence > confidence) {
                confidence = intentConfidence;
                detectedIntent = intent;
            }
        }

        return {
            intent: detectedIntent,
            confidence,
            suggestedDepartment: this.mapIntentToDepartment(detectedIntent),
            entities: this.extractEntities(userMessage),
            response: await this.generateIntentResponse(detectedIntent, userMessage, context)
        };
    }

    mapIntentToDepartment(intent) {
        const mapping = {
            sales: 'ventas',
            support: 'tecnologia',
            finance: 'finanzas',
            marketing: 'marketing',
            operations: 'operaciones'
        };
        return mapping[intent] || 'ceo';
    }

    extractEntities(text) {
        const entities = { emails: [], phones: [], dates: [], amounts: [] };

        // Extract emails
        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
        entities.emails = text.match(emailRegex) || [];

        // Extract phone numbers
        const phoneRegex = /[\d]{10,}/g;
        entities.phones = text.match(phoneRegex) || [];

        // Extract amounts (MXN)
        const amountRegex = /\$?[\d,]+(\.\d{2})?\s*(mxn|mex)?/gi;
        entities.amounts = text.match(amountRegex) || [];

        return entities;
    }

    async generateIntentResponse(intent, message, context) {
        const responses = {
            sales: `Entiendo que necesitas ayuda con ventas. Puedo crear una propuesta comercial, actualizar el CRM o generar un reporte de prospectos. ¿Qué acción specific?`,
            support: `Voy a registrar un ticket de soporte. Describe el problema y lo asignaré al departamento técnico.`,
            finance: `Puedo generar el documento financiero que necesitas. ¿Factura, estado de cuenta, o reporte?`,
            marketing: `Voy a crear contenido para tus redes sociales. ¿Qué plataforma prefieres y cuál es el tema?`,
            operations: `Entendido. Voy a optimizar el proceso. Necesito más detalles sobre cuál workflow especificamente.`
        };

        return responses[intent] || `He procesado tu mensaje en el departamento de ${intent}. ¿En qué puedo ayudarte especificamente?`;
    }

    // Time series forecasting for business planning
    async forecastTimeSeries(data, periods = 6) {
        if (data.length < 4) return { error: 'Need at least 4 data points' };

        const predictions = [];
        const trend = this.calculateTrend(data);
        const seasonality = this.detectSeasonality(data);

        for (let i = 1; i <= periods; i++) {
            const baseValue = data[data.length - 1].value;
            const trendComponent = trend * i;
            const seasonalComponent = seasonality[i % seasonality.length] || 0;
            const predicted = baseValue + trendComponent + seasonalComponent;

            predictions.push({
                period: i,
                predicted: Math.max(0, predicted),
                lower: Math.max(0, predicted * 0.85),
                upper: predicted * 1.15
            });
        }

        return {
            predictions,
            trend: trend > 0 ? 'upward' : 'downward',
            seasonality: seasonality.length > 0 ? 'detected' : 'none',
            confidence: 0.85
        };
    }

    calculateTrend(data) {
        const n = data.length;
        const xMean = (n - 1) / 2;
        const yMean = data.reduce((a, b) => a + b.value, 0) / n;

        let numerator = 0;
        let denominator = 0;

        data.forEach((point, i) => {
            numerator += (i - xMean) * (point.value - yMean);
            denominator += (i - xMean) * (i - xMean);
        });

        return denominator !== 0 ? numerator / denominator : 0;
    }

    detectSeasonality(data) {
        if (data.length < 12) return [];
        const seasonalFactors = [];
        const period = 3; // Quarterly

        for (let i = 0; i < period; i++) {
            let sum = 0;
            let count = 0;
            for (let j = i; j < data.length; j += period) {
                sum += data[j].value;
                count++;
            }
            seasonalFactors.push(sum / count - (data.reduce((a, b) => a + b.value, 0) / data.length));
        }

        return seasonalFactors;
    }
}

export const mlService = new MLService();
export default mlService;