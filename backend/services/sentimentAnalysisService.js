const axios = require('axios');

/**
 * Hugging Face API Configuration
 * Models for sentiment, emotion, and stress analysis
 */
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY || '';
const HF_API_BASE = 'https://api-inference.huggingface.co/models';

const MODELS = {
  sentiment: 'nlptown/bert-base-multilingual-uncased-sentiment',
  emotion: 'j-hartmann/emotion-english-distilroberta-base',
  stress: 'michellejieli/ONNX_distilbert_base_uncased_finetuned_sst_2_english',
};

/**
 * Retry helper with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, initialDelayMs = 2000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[HF] Attempt ${i + 1}/${maxRetries}...`);
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if it's a 410 or 429 error (model loading or rate limit)
      if (error.response?.status === 410 || error.response?.status === 429) {
        if (i < maxRetries - 1) {
          // Backoff: 2s, 4s, 8s for 410/429 errors
          const waitTime = initialDelayMs * Math.pow(2, i);
          console.log(`[HF] Status ${error.response.status} - Waiting ${waitTime}ms before retry ${i + 2}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          console.log(`[HF] Status ${error.response.status} - All retries exhausted, using keyword fallback`);
        }
      } else {
        // For other errors, use fallback immediately
        console.log(`[HF] Non-retryable error (${error.response?.status}), falling back immediately`);
        throw error;
      }
    }
  }
  
  // All retries failed, throw last error so caller can use fallback
  throw lastError;
};

/**
 * Simple keyword-based sentiment analysis for fallback
 */
const keywordSentimentAnalysis = (text) => {
  const textLower = text.toLowerCase();
  
  const positiveWords = [
    'good', 'great', 'excellent', 'happy', 'wonderful', 'love', 'amazing', 'awesome', 'best',
    'mabuti', 'maganda', 'masaya', 'mahusay', 'napakaganda', 'napakagandang', 'yey', 'nice', 'cool',
    'grateful', 'blessed', 'wonderful', 'fantastic', 'beautiful', 'proud', 'content', 'joyful', 'delighted'
  ];
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'sad', 'hate', 'horrible', 'angry', 'frustrated', 'worst',
    'masama', 'nakakapagod', 'lungkot', 'lungkutan', 'galit', 'mainit', 'mainis', 'sarado',
    'alone', 'lonely', 'depressed', 'miserable', 'upset', 'worried', 'anxious', 'scared', 'fear',
    'suffering', 'crying', 'crying', 'devastated', 'helpless', 'desperate', 'hopeless', 'broken',
    'alone', 'abandoned', 'rejected', 'unwanted', 'unloved'
  ];
  
  let positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
  let negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
  
  let sentiment = 'neutral';
  let positive = 0.33, negative = 0.33, neutral = 0.34;
  
  if (positiveCount > negativeCount) {
    sentiment = 'positive';
    positive = Math.min(0.5 + positiveCount * 0.1, 0.8);
    negative = Math.max(0.1, 0.5 - positiveCount * 0.1);
    neutral = 1 - positive - negative;
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
    negative = Math.min(0.5 + negativeCount * 0.1, 0.8);
    positive = Math.max(0.1, 0.5 - negativeCount * 0.1);
    neutral = 1 - positive - negative;
  }
  
  return { sentiment, positive, negative, neutral };
};

/**
 * Simple emotion detection from keywords
 */
const keywordEmotionAnalysis = (text) => {
  const textLower = text.toLowerCase();
  
  const emotionKeywords = {
    joy: ['happy', 'masaya', 'saya', 'smile', 'laugh', 'yey', 'great', 'wonderful', 'grateful', 'blessed', 'delighted'],
    sadness: ['sad', 'lungkot', 'nawala', 'malungkot', 'cry', 'down', 'alone', 'lonely', 'depressed', 'miserable', 'heartbroken'],
    anger: ['angry', 'galit', 'mainit', 'furious', 'mainis', 'frustrated', 'upset', 'irritated'],
    fear: ['afraid', 'scared', 'takot', 'nervous', 'panic', 'anxious', 'worried', 'terrified'],
    surprise: ['wow', 'amazing', 'shock', 'surprised', 'unexpected', 'astonished'],
    neutral: ['normal', 'okay', 'fine', 'alright', 'meh']
  };
  
  const scores = {};
  Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
    scores[emotion] = keywords.filter(word => textLower.includes(word)).length;
  });
  
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const breakdown = {};
  let maxEmotion = 'neutral';
  let maxScore = 0;
  
  Object.entries(scores).forEach(([emotion, count]) => {
    breakdown[emotion] = count / totalScore;
    if (count > maxScore) {
      maxScore = count;
      maxEmotion = emotion;
    }
  });
  
  return {
    primary: maxEmotion,
    confidence: Math.min(maxScore / totalScore, 0.9),
    breakdown
  };
};

/**
 * Simple stress detection from keywords
 */
const keywordStressAnalysis = (text) => {
  const textLower = text.toLowerCase();
  
  const highStressKeywords = [
    'stress', 'stressed', 'stressful', 'anxiety', 'anxious', 'panic', 'panicking', 'overwhelmed', 'overwhelming',
    'depressed', 'depression', 'exhausted', 'burnout', 'burnt out', 'breakdown', 'crisis', 'disaster',
    'terrible', 'awful', 'horrible', 'unbearable', 'miserable', 'devastated', 'desperate', 'hopeless',
    'angry', 'anger', 'furious', 'enraged', 'livid',
    'alalahanin', 'mabigat', 'napakahirap', 'napakabigat', 'sirang-sira', 'pagod na pagod', 'giyaw', 'kahirapan', 'galit', 'init'
  ];
  
  const mediumStressKeywords = [
    'worried', 'worry', 'concerned', 'concern', 'nervous', 'pressured', 'pressure', 'tense',
    'tension', 'busy', 'overwhelm', 'challenge', 'challenged', 'difficult', 'struggling', 'struggle',
    'tired', 'fatigue', 'worn out', 'uneasy', 'uncomfortable', 'irritable', 'frustrated', 'frustration',
    'upset', 'irritated', 'annoyed', 'annoying', 'mainis', 'upset', 'mainit',
    'alalahanin', 'takot', 'mainit', 'frustrated', 'galit', 'problema', 'kabaguhan'
  ];
  
  const calmKeywords = [
    'calm', 'peaceful', 'peace', 'relax', 'relaxed', 'rest', 'rested', 'okay', 'fine', 'good', 'great',
    'wonderful', 'happy', 'masaya', 'okay lang', 'ayos', 'okay na', 'peaceful', 'serene', 'tranquil'
  ];
  
  const highStressCount = highStressKeywords.filter(word => textLower.includes(word)).length;
  const mediumStressCount = mediumStressKeywords.filter(word => textLower.includes(word)).length;
  const calmCount = calmKeywords.filter(word => textLower.includes(word)).length;
  
  let level = 'low';
  let score = 0.2;
  
  // Simple logic: if any stress keyword found, set appropriate level
  if (highStressCount >= 1) {
    // Any high-stress keyword = HIGH stress
    level = 'high';
    score = Math.min(0.75 + (highStressCount * 0.1), 0.95);
  } else if (mediumStressCount >= 1 && calmCount === 0) {
    // Any medium stress keyword (like "worried", "nervous") = MEDIUM stress
    level = 'medium';
    score = Math.min(0.45 + (mediumStressCount * 0.1), 0.65);
  } else if (calmCount > 0 && (highStressCount + mediumStressCount) === 0) {
    // Only calm keywords = LOW stress
    level = 'low';
    score = 0.1;
  } else {
    level = 'low';
    score = 0.2;
  }
  
  // Anxiety level calculation (independent of stress)
  const anxietyKeywords = [
    'anxious', 'anxiety', 'panic', 'panicking', 'nervous', 'uneasy', 'worried', 'afraid', 'fear', 'scared',
    'angry', 'anger', 'furious', 'upset', 'irritated', 'annoyed',
    'takot', 'takot na takot', 'concerned', 'galit', 'init', 'mainit'
  ];
  
  const anxietyCount = anxietyKeywords.filter(word => textLower.includes(word)).length;
  
  let anxietyLevel = 'low';
  let anxietyScore = 0.2;
  
  if (anxietyCount >= 2) {
    // Multiple anxiety keywords = HIGH anxiety
    anxietyLevel = 'high';
    anxietyScore = Math.min(0.75 + (anxietyCount * 0.1), 0.95);
  } else if (anxietyCount >= 1) {
    // Even 1 anxiety keyword (worried, nervous, afraid, angry, etc.) = MEDIUM anxiety
    anxietyLevel = 'medium';
    anxietyScore = Math.min(0.45 + (anxietyCount * 0.15), 0.65);
  }
  
  return { level, score, anxiety: { level: anxietyLevel, score: anxietyScore } };
};

/**
 * Analyze sentiment
 */
exports.analyzeSentiment = async (text) => {
  try {
    if (!text || text.trim().length === 0) {
      return {
        primary: 'neutral',
        positive: 0,
        negative: 0,
        neutral: 1,
        confidence: 0,
      };
    }

    const response = await retryWithBackoff(
      () => axios.post(
        `${HF_API_BASE}/${MODELS.sentiment}`,
        { inputs: text },
        {
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      )
    );

    if (response.data && response.data[0]) {
      const scores = response.data[0];
      const sorted = scores.sort((a, b) => b.score - a.score);
      
      console.log('[HF] Sentiment API Response:', JSON.stringify(sorted));
      
      // Parse the scores more robustly
      const sentimentMap = {
        positive: 0,
        negative: 0,
        neutral: 0,
      };
      
      scores.forEach((item) => {
        const label = item.label.toLowerCase();
        if (label.includes('positive')) sentimentMap.positive = item.score;
        else if (label.includes('negative')) sentimentMap.negative = item.score;
        else if (label.includes('neutral')) sentimentMap.neutral = item.score;
      });
      
      // Determine primary sentiment
      let primary = 'neutral';
      if (sentimentMap.positive > sentimentMap.negative && sentimentMap.positive > sentimentMap.neutral) {
        primary = 'positive';
      } else if (sentimentMap.negative > sentimentMap.neutral) {
        primary = 'negative';
      }
      
      console.log('[HF] Sentiment Analysis:', { primary, ...sentimentMap, apiLabel: sorted[0].label });
      
      return {
        primary,
        positive: sentimentMap.positive,
        negative: sentimentMap.negative,
        neutral: sentimentMap.neutral,
        confidence: sorted[0].score,
      };
    }

    // Fallback if response structure is unexpected
    console.warn('[HF] Unexpected response structure, using keyword analysis');
    const { sentiment, positive, negative, neutral } = keywordSentimentAnalysis(text);
    return { primary: sentiment, positive, negative, neutral, confidence: 0.6, fallback: true };
    
  } catch (error) {
    console.error('[HF] Sentiment Analysis Error - Using Fallback:', error.message);
    console.log('[Fallback] Analyzing with keyword-based sentiment analysis');
    
    // Use keyword-based fallback immediately
    const { sentiment, positive, negative, neutral } = keywordSentimentAnalysis(text);
    return {
      primary: sentiment,
      positive,
      negative,
      neutral,
      confidence: 0.6,
      fallback: true
    };
  }
};

/**
 * Detect emotion
 */
exports.detectEmotion = async (text) => {
  try {
    if (!text || text.trim().length === 0) {
      return { primary: 'neutral', confidence: 0, breakdown: {} };
    }

    const response = await retryWithBackoff(
      () => axios.post(
        `${HF_API_BASE}/${MODELS.emotion}`,
        { inputs: text },
        {
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      )
    );

    if (response.data && response.data[0]) {
      const emotions = response.data[0];
      const sorted = emotions.sort((a, b) => b.score - a.score);
      
      const breakdown = {};
      emotions.forEach(e => {
        breakdown[e.label.toLowerCase()] = e.score;
      });

      console.log('[HF] Emotion API Success:', sorted[0].label);

      return {
        primary: sorted[0].label.toLowerCase(),
        confidence: sorted[0].score,
        breakdown,
      };
    }

    // Fallback
    console.warn('[HF] Unexpected emotion response, using keyword analysis');
    return keywordEmotionAnalysis(text);
    
  } catch (error) {
    console.error('[HF] Emotion Detection Error - Using Fallback:', error.message);
    console.log('[Fallback] Analyzing with keyword-based emotion analysis');
    
    // Use keyword-based fallback immediately
    return keywordEmotionAnalysis(text);
  }
};

/**
 * Detect stress and anxiety
 */
exports.detectStressAndAnxiety = async (text) => {
  try {
    if (!text || text.trim().length === 0) {
      return {
        level: 'low',
        score: 0,
        anxiety: { level: 'low', score: 0 },
      };
    }

    // Use zero-shot for stress detection
    const stressLabels = [
      'highly stressed and anxious',
      'moderately stressed',
      'slightly stressed',
      'calm and relaxed',
    ];

    const response = await retryWithBackoff(
      () => axios.post(
        `${HF_API_BASE}/facebook/bart-large-mnli`,
        {
          inputs: text,
          parameters: {
            candidate_labels: stressLabels,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      )
    );

    if (response.data?.scores) {
      const scores = response.data.scores;
      const stressScore = Math.max(scores[0], scores[1]);
      const anxietyScore = scores[0]; // "highly stressed and anxious"

      console.log('[HF] Stress API Success - Score:', stressScore);

      return {
        level: stressScore > 0.6 ? 'high' : stressScore > 0.3 ? 'medium' : 'low',
        score: stressScore,
        anxiety: {
          level: anxietyScore > 0.6 ? 'high' : anxietyScore > 0.3 ? 'medium' : 'low',
          score: anxietyScore,
        },
      };
    }

    // Fallback
    console.warn('[HF] Unexpected stress response, using keyword analysis');
    return keywordStressAnalysis(text);
    
  } catch (error) {
    console.error('[HF] Stress Detection Error:', error.message);
    console.log('[Fallback] Using keyword-based stress analysis');
    
    // Use keyword-based fallback
    return keywordStressAnalysis(text);
  }
};

/**
 * Comprehensive analysis combining all models
 */
exports.comprehensiveAnalysis = async (text) => {
  try {
    if (!text || text.trim().length === 0) {
      return {
        sentiment: { primary: 'neutral', positive: 0, negative: 0, neutral: 1, confidence: 0 },
        emotion: { primary: 'neutral', confidence: 0, breakdown: {} },
        stress: { level: 'low', score: 0, anxiety: { level: 'low', score: 0 } },
      };
    }

    console.log('[Analysis] Starting comprehensive analysis for text:', text.substring(0, 50) + '...');

    // Run all analyses in parallel
    const [sentiment, emotion, stress] = await Promise.all([
      exports.analyzeSentiment(text),
      exports.detectEmotion(text),
      exports.detectStressAndAnxiety(text),
    ]);

    const result = {
      sentiment,
      emotion,
      stress,
      timestamp: new Date(),
      text: text.substring(0, 100),
    };

    console.log('[Analysis] Completed - Sentiment:', sentiment.primary, 'Emotion:', emotion.primary, 'Stress:', stress.level);

    return result;
  } catch (error) {
    console.error('[Analysis] Comprehensive analysis error:', error.message);
    // Return fallback results
    return {
      sentiment: { primary: 'neutral', positive: 0.33, negative: 0.33, neutral: 0.34, confidence: 0.5, fallback: true },
      emotion: { primary: 'neutral', confidence: 0.5, breakdown: { neutral: 1 }, fallback: true },
      stress: { level: 'low', score: 0.3, anxiety: { level: 'low', score: 0.3 }, fallback: true },
      error: error.message,
    };
  }
};

module.exports = exports;
