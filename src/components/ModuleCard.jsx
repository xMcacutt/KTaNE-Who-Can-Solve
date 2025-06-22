import React, { useEffect } from "react";

function ModuleCard({
    module,
    index,
    user,
    score,
    setScores,
    isHovered,
    isVisible,
    onHoverStart,
    onHoverEnd,
    onHeightChange,
}) {
    const [defuserConfidence, setDefuserConfidence] = useState(score?.defuser || 'Unknown');
    const [expertConfidence, setExpertConfidence] = useState(score?.expert || 'Unknown');

    const confidenceOptions = [
        'Unknown',
        'Attempted',
        'Solved',
        'Confident',
        'Extremely Confident',
        'Avoid',
    ];

    const handleScoreChange = async (type, value) => {
        if (!user) return;
        try {
            setScores((prev) => ({
                ...prev,
                [module.module_id]: {
                    ...prev[module.module_id],
                    [type]: value,
                },
            }));

            await axios.post(
                `http://localhost:5000/api/scores/${module.module_id}`,
                {
                    defuserConfidence: type === 'defuser' ? value : score?.defuser || 'Unknown',
                    expertConfidence: type === 'expert' ? value : score?.expert || 'Unknown',
                },
                { withCredentials: true }
            );
        } catch (error) {
            console.error('Failed to update score:', error);
            setScores((prev) => ({
                ...prev,
                [module.module_id]: score,
            }));
        };
    };

    const encodedModuleName = encodeURIComponent(module.icon_file_name);
    const imageUrl = `https://raw.githubusercontent.com/Timwi/KtaneContent/refs/heads/master/Icons/${encodedModuleName}.png`;
    const manualUrl = `https://ktane.timwi.de/HTML/${encodedModuleName}.html`;

    const formattedDate = module.published
        ? new Date(module.published).toISOString().split("T")[0]
        : "N/A";

    // Trigger measurement when hover state changes
    useEffect(() => {
        if (onHeightChange) {
            onHeightChange();
        }
    }, [isHovered, onHeightChange]);

    return (
        <div
            className={`list-item d-flex justify-content-between align-items-center ${isHovered ? 'hovered' : ''} ${isVisible ? 'visible' : ''}`}
            onMouseEnter={onHoverStart}
            onMouseLeave={onHoverEnd}
        >
            <div className="d-flex align-items-center">
                <img
                    src={imageUrl}
                    alt={module.name}
                    className="module-icon"
                    onError={(e) => {
                        console.error(module.name, e);
                        e.target.onerror = null;
                        e.target.src = '/fallback-img.png';
                    }}
                />
                <div>
                    <a className="link" href={manualUrl}>
                        <h3>{module.name}</h3>
                    </a>
                    <div className="description-container">
                        <p className="description">{module.description}</p>
                    </div>
                    <div className="module-details">
                        <span>Authors: {module.developers?.join(', ') || 'Unknown'}</span>
                        <span>Published: {formattedDate}</span>
                        <span>Defuser: {module.defuser_difficulty || 'N/A'}</span>
                        <span>Expert: {module.expert_difficulty || 'N/A'}</span>
                    </div>
                </div>
            </div>
            <div className="confidence-section d-flex flex-column gap-2">
                {user ? (
                    <>
                        <div>
                            <label>Defuser Confidence: </label>
                            <select
                                value={defuserConfidence}
                                onChange={(e) => {
                                    setDefuserConfidence(e.target.value);
                                    handleScoreChange('defuser', e.target.value);
                                }}
                            >
                                {confidenceOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>Expert Confidence: </label>
                            <select
                                value={expertConfidence}
                                onChange={(e) => {
                                    setExpertConfidence(e.target.value);
                                    handleScoreChange('expert', e.target.value);
                                }}
                            >
                                {confidenceOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                ) : (
                    <span className="confidence italic login-text">
                        Log in to view and edit confidence scores
                    </span>
                )}
            </div>
        </div>
    );
}

export default React.memo(ModuleCard);