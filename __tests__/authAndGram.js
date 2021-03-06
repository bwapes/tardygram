require('../lib/data/data-helper');
const { getAgent } = require('../lib/data/data-helper');
const request = require('supertest');
const app = require('../lib/app');
const Gram = require('../lib/models/gram');

describe('tardygram post gram route', () => {
  it('should insert a gram if user is authorized via POST', async() => {
    const agent = request.agent(app);
    await agent
      .post('/api/v1/auth/signup')
      .send({
        email: 'ben@ben.com',
        password: 'password'
      });
    
    const placeHolder = {
      photoUrl: 'aurlto the photo', 
      caption: 'I love cranberry',
      tags: ['spicy', 'hot', 'tasty']
    };

    return await agent
      .post('/api/v1/posts')
      .send(placeHolder)
      .then(post => expect(post.body).toEqual({ ...placeHolder, id: expect.any(String), userId: expect.any(Number) }));
  });

  it('should not let a user post if they are not authorized via POST', async() => {
    return await request(app)
      .post('/api/v1/posts')
      .send({
        caption: 'I love cranberry',
        tags: ['spicy', 'hot', 'tasty']
      })
      .then(post => expect(post.body).toEqual({ status: 500, message: 'jwt must be provided' }));
  });

  it('should get all posts via GET', async() => {
    return await request(app)
      .get('/api/v1/posts')
      .then(posts => expect(posts.body.length).toEqual(20));
  });

  it('should get a post by id via GET', async() => {
    const firstPost = (await Gram.findAll())[0];
    return request(app)
      .get(`/api/v1/posts/${firstPost.id}`)
      .then(res => expect(res.body).toEqual({ id: expect.any(String), caption: firstPost.caption, tags: firstPost.tags, username: expect.any(String) }));
  });

  it('should allow a user to update their caption via PATCH', async() => {
  
    const { body } = await getAgent()
      .post('/api/v1/posts')
      .send({
        userId: 1,
        photoUrl: 'blah blah',
        caption: 'beginning caption',
        tags: ['run this town', 'how about it']
      });
    
    return getAgent()
      .patch(`/api/v1/posts/${body.id}`)
      .send({
        userId: body.userId,
        caption: 'thought it was cute, might delete later'
      })
      .then(res => expect(res.body).toEqual({
        id: expect.any(String),
        userId: body.userId,
        photoUrl: expect.any(String),
        caption: 'thought it was cute, might delete later',
        tags: expect.any(Array),
      }));
  });

  it('should delete a users gram by id via DELETE', async() => {
    
    const { body } = await getAgent()
      .post('/api/v1/posts')
      .send({
        userId: 1,
        photoUrl: 'blah blah',
        caption: 'beginning caption',
        tags: ['run this town', 'how about it']
      });
    
    return getAgent()
      .delete(`/api/v1/posts/${body.id}`)
      .send({ userId: body.userId })
      .then(res => expect(res.body).toEqual(body));
  });

  it('should get the 10 most popular posts with most comments via GET', async() => {
    return await request(app)
      .get('/api/v1/posts/popular')
      .then(res => expect(res.body.length).toEqual(10));
  });
});

describe('tardygram auth routes', () => {
  it('sign up a user via POST', async() => {
    const response = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'ben@ben.com',
        password: 'password'
      });

    expect(response.body).toEqual({
      id: expect.any(String),
      email: 'ben@ben.com'
    });
  });

  it('sets authorization for a user based on email via POST', async() => {
    const response = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'ben@ben.com',
        password: 'password'
      });

    const foundUser = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'ben@ben.com',
        password: 'password'
      });

    expect(foundUser.body).toEqual(response.body);
  });

  it('should verify a user via GET', async() => {
    const agent = request.agent(app);
    await agent
      .post('/api/v1/auth/signup')
      .send({
        email: 'ben@ben.com',
        password: 'password'
      });
    
    const response = await agent
      .get('/api/v1/auth/verify');

    expect(response.body).toEqual({
      id: expect.any(String),
      email: 'ben@ben.com'
    });
      
    const responseWithoutUser = await request(app)
      .get('/api/v1/auth/verify');

    expect(responseWithoutUser.body).toEqual({
      status: 500,
      message: 'jwt must be provided'
    });
  });
});
 
