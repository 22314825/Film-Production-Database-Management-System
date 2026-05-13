const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Movies
    getAllMovies: () => ipcRenderer.invoke('get-all-movies'),
    getMovieFullRoster: (id) => ipcRenderer.invoke('get-movie-full-roster', id),
    getMovieTotalSpend: (id) => ipcRenderer.invoke('get-movie-total-spend', id),
    
    // People
    getAllActors: () => ipcRenderer.invoke('get-all-actors'),
    getAllDirectors: () => ipcRenderer.invoke('get-all-directors'),
    getAllProducers: () => ipcRenderer.invoke('get-all-producers'),
    getAllCrew: () => ipcRenderer.invoke('get-all-crew'),
    getMoviesByActorId: (id) => ipcRenderer.invoke('get-movies-by-actor-id', id),
    getMoviesByDirectorId: (id) => ipcRenderer.invoke('get-movies-by-director-id', id),
    getMoviesByProducerId: (id) => ipcRenderer.invoke('get-movies-by-producer-id', id),
    getMoviesByCrewMemberId: (id) => ipcRenderer.invoke('get-movies-by-crew-member-id', id),
    getDirectorRoi: (id) => ipcRenderer.invoke('get-director-roi', id),

    // Finance & Queries
    getFinancialOverview: () => ipcRenderer.invoke('get-financial-overview'),
    getTopPaidActors: () => ipcRenderer.invoke('get-top-paid-actors'),
    getProfitableMovies: () => ipcRenderer.invoke('get-profitable-movies'),
    getGenrePerformance: () => ipcRenderer.invoke('get-genre-performance'),

    // Get by ID
    getActorById: (id) => ipcRenderer.invoke('get-actor-by-id', id),
    getDirectorById: (id) => ipcRenderer.invoke('get-director-by-id', id),
    getProducerById: (id) => ipcRenderer.invoke('get-producer-by-id', id),
    getCrewMemberById: (id) => ipcRenderer.invoke('get-crew-member-by-id', id),
    getMovieFinance: (id) => ipcRenderer.invoke('get-movie-finance', id),
    getMovieProducers: (id) => ipcRenderer.invoke('get-movie-producers', id),

    // Advanced Workflows
    updateMovieFinance: (data) => ipcRenderer.invoke('update-movie-finance', data),
    assignMovieActor: (data) => ipcRenderer.invoke('assign-movie-actor', data),
    assignMovieCrew: (data) => ipcRenderer.invoke('assign-movie-crew', data),
    assignMovieDirector: (data) => ipcRenderer.invoke('assign-movie-director', data),
    publishMovie: (data) => ipcRenderer.invoke('publish-movie', data),

    // Unassign
    unassignMovieActor: (data) => ipcRenderer.invoke('unassign-movie-actor', data),
    unassignMovieDirector: (data) => ipcRenderer.invoke('unassign-movie-director', data),
    unassignMovieCrew: (data) => ipcRenderer.invoke('unassign-movie-crew', data),
    unassignMovieProducer: (data) => ipcRenderer.invoke('unassign-movie-producer', data),

    // Re-assign
    updateMovieActor: (data) => ipcRenderer.invoke('update-movie-actor', data),
    updateMovieCrew: (data) => ipcRenderer.invoke('update-movie-crew', data),

    // Update person info
    updateActor: (data) => ipcRenderer.invoke('update-actor', data),
    updateDirector: (data) => ipcRenderer.invoke('update-director', data),
    updateProducer: (data) => ipcRenderer.invoke('update-producer', data),
    updateCrewMember: (data) => ipcRenderer.invoke('update-crew-member', data),

    // Mutations
    deleteEntity: (type, id) => ipcRenderer.invoke('delete-entity', type, id),
    addEntity: (type, data) => ipcRenderer.invoke('add-entity', type, data)
});
