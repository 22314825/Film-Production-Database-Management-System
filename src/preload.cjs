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

    // Advanced Workflows
    updateMovieFinance: (data) => ipcRenderer.invoke('update-movie-finance', data),
    assignMovieActor: (data) => ipcRenderer.invoke('assign-movie-actor', data),
    assignMovieCrew: (data) => ipcRenderer.invoke('assign-movie-crew', data),

    // Mutations
    deleteEntity: (type, id) => ipcRenderer.invoke('delete-entity', type, id),
    addEntity: (type, data) => ipcRenderer.invoke('add-entity', type, data)
});
