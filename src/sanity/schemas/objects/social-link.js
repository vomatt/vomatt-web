import {
	FaFacebookF,
	FaGithub,
	FaInstagram,
	FaLinkedin,
	FaSpotify,
	FaTwitter,
	FaYoutube,
} from 'react-icons/fa';
import { defineType } from 'sanity';

const getIcon = (icon) => {
	switch (icon) {
		case 'facebook':
			return FaFacebookF;
		case 'instagram':
			return FaInstagram;
		case 'linkedin':
			return FaLinkedin;
		case 'spotify':
			return FaSpotify;
		case 'twitter':
			return FaTwitter;
		case 'youTube':
			return FaYoutube;
		case 'github':
			return FaGithub;
		default:
			return false;
	}
};

export default defineType({
	title: 'Social Link',
	name: 'socialLink',
	type: 'object',
	options: {
		columns: 2,
		collapsible: false,
	},
	fields: [
		{
			title: 'Icon',
			name: 'icon',
			type: 'string',
			options: {
				list: [
					{ title: 'Facebook', value: 'facebook' },
					{ title: 'Instagram', value: 'instagram' },
					{ title: 'Linkedin', value: 'linkedin' },
					{ title: 'Twitter', value: 'twitter' },
					{ title: 'YouTube', value: 'youTube' },
					{ title: 'Github', value: 'github' },
					{ title: 'Spotify', value: 'spotify' },
				],
			},
		},
		{
			title: 'URL',
			name: 'url',
			type: 'url',
		},
	],
	preview: {
		select: {
			icon: 'icon',
			url: 'url',
		},
		prepare({ icon, url }) {
			return {
				title: icon,
				subtitle: url ? url : '(url not set)',
				media: getIcon(icon),
			};
		},
	},
});
