export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  create(data, options = {}) {
    return this.model.create([data], options).then((docs) => docs[0]);
  }

  findById(id, projection = null) {
    return this.model.findById(id, projection);
  }

  findOne(filter, projection = null) {
    return this.model.findOne(filter, projection);
  }

  find(filter = {}, options = {}) {
    return this.model.find(filter, null, options);
  }

  updateOne(filter, update, options = { new: true }) {
    return this.model.findOneAndUpdate(filter, update, options);
  }

  paginate(filter = {}, { page = 1, limit = 20, sort = { createdAt: -1 }, populate = [] } = {}) {
    const skip = (Number(page) - 1) * Number(limit);
    const query = this.model.find(filter).sort(sort).skip(skip).limit(Number(limit));
    populate.forEach((item) => query.populate(item));
    return Promise.all([query, this.model.countDocuments(filter)]).then(([rows, total]) => ({
      rows,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    }));
  }
}
