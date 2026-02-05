import React from 'react';
import VideoActivity from './activities/VideoActivity';
import TextActivity from './activities/TextActivity';
import QuizActivity from './activities/QuizActivity';
import UploadActivity from './activities/UploadActivity';
import GenericActivity from './activities/GenericActivity';
import ArticleActivity from './activities/ArticleActivity';
import DocumentActivity from './activities/DocumentActivity';

const ActivityRenderer = ({ activity, onAnswer, contentId, userId, currentAnswer, onActivityCompleted }) => {
    if (!activity) return <div>Atividade vazia</div>;

    const props = {
        data: activity.data || activity,
        // Pass context for response submission and state
        context: {
            contentId,
            userId,
            templateId: activity._id,
            tipo: activity.tipo
        },
        currentAnswer, // Pass the existing answer object if any
        onActivityCompleted, // Callback to refresh parent state
        onAnswer, // Pass to ALL components
        activityId: activity._id // Explicit ID pass
    };

    switch (activity.tipo) {
        case 'video':
            return <VideoActivity {...props} />;
        case 'texto_livre':
            return <TextActivity {...props} />;
        case 'artigo':
            return <ArticleActivity {...props} />;
        case 'multipla_escolha':
            return <QuizActivity {...props} />;
        case 'upload':
            return <UploadActivity {...props} />;
        case 'documento':
        case 'document': // Fallback for various naming
            return <DocumentActivity {...props} />;
        default:
            return <GenericActivity type={activity.tipo} data={activity.data || activity} />;
    }
};

export default ActivityRenderer;
