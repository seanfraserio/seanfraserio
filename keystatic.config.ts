import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'cloud',
  },
  cloud: {
    project: 'seanfraserio/seanfraserio',
  },
  ui: {
    brand: {
      name: 'CloudHacks',
    },
  },
  collections: {
    posts: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'content/blog/**',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: {
            label: 'Title',
            validation: { isRequired: true },
          },
        }),
        description: fields.text({
          label: 'Description',
          description: 'A short summary for SEO and previews',
          validation: { isRequired: true },
          multiline: true,
        }),
        date: fields.date({
          label: 'Publish Date',
          validation: { isRequired: true },
        }),
        updated: fields.date({
          label: 'Last Updated',
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Cloud Security', value: 'Cloud Security' },
            { label: 'Cloud Computing', value: 'Cloud Computing' },
            { label: 'DevOps', value: 'DevOps' },
            { label: 'Tutorials', value: 'Tutorials' },
          ],
          defaultValue: 'Cloud Computing',
        }),
        tags: fields.array(
          fields.text({ label: 'Tag' }),
          {
            label: 'Tags',
            itemLabel: (props) => props.value || 'New Tag',
          }
        ),
        image: fields.image({
          label: 'Featured Image',
          directory: 'public/images/blog',
          publicPath: '/images/blog/',
        }),
        imageAlt: fields.text({
          label: 'Image Alt Text',
        }),
        featured: fields.checkbox({
          label: 'Featured Post',
          description: 'Show this post prominently on the homepage',
          defaultValue: false,
        }),
        draft: fields.checkbox({
          label: 'Draft',
          description: 'Draft posts are not published',
          defaultValue: false,
        }),
        content: fields.markdoc({
          label: 'Content',
          extension: 'md',
        }),
      },
    }),
  },
});
