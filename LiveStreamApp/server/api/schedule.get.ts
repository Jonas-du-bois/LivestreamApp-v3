export default defineEventHandler((event) => {
  return {
    meta: {
      availableApparatus: ['Sol', 'Barres', 'Poutre', 'Saut'],
      availableDays: ['samedi', 'dimanche']
    },
    data: [
      {
        _id: '1',
        startTime: '2023-10-21T09:00:00.000Z',
        location: 'Salle 1',
        status: 'SCHEDULED',
        group: { _id: 'g1', name: 'FSG Yverdon' },
        apparatus: { _id: 'a1', code: 'SS', name: 'Sol', icon: 'fluent:box-24-regular' }
      },
      {
        _id: '2',
        startTime: '2023-10-21T09:15:00.000Z',
        location: 'Salle 2',
        status: 'SCHEDULED',
        group: { _id: 'g2', name: 'FSG Morges' },
        apparatus: { _id: 'a2', code: 'BA', name: 'Barres', icon: 'fluent:table-simple-24-regular' }
      }
    ]
  }
})
