import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { colors } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="107.893" height="17.782" viewBox="0 0 107.893 17.782">
  <defs>
    <clipPath id="clip-path">
      <rect id="Rectangle_147800" data-name="Rectangle 147800" width="107.893" height="17.782" fill="none"/>
    </clipPath>
  </defs>
  <g id="Group_166307" data-name="Group 166307" transform="translate(-77.135 -50.929)">
    <g id="Group_166303" data-name="Group 166303" transform="translate(77.135 50.929)">
      <g id="Group_166302" data-name="Group 166302" transform="translate(0 0)" clip-path="url(#clip-path)">
        <path id="Path_83344" data-name="Path 83344" d="M0,1.12A27.956,27.956,0,0,1,4.174.825a8.693,8.693,0,0,1,4.1.679,2.871,2.871,0,0,1,1.77,2.676,2.972,2.972,0,0,1-2.26,2.792v.043a3.343,3.343,0,0,1,2.733,3.273A3.52,3.52,0,0,1,9.008,13.17c-1.031.752-2.715,1.161-5.491,1.161A25.335,25.335,0,0,1,0,14.121ZM3.1,6.131H4.21c1.8,0,2.672-.617,2.672-1.57,0-1.016-.864-1.474-2.317-1.474a8.379,8.379,0,0,0-1.465.1Zm0,5.852a9.314,9.314,0,0,0,1.34.056c1.463,0,2.771-.485,2.771-1.9,0-1.323-1.282-1.8-2.932-1.8H3.1Z" transform="translate(0 -0.329)" fill="#382476"/>
        <path id="Path_83345" data-name="Path 83345" d="M26.471,16.513l-.189-.958h-.07a3.794,3.794,0,0,1-2.953,1.194,3.045,3.045,0,0,1-3.3-2.95c0-2.5,2.247-3.737,6.059-3.724V9.983c0-.428-.219-1.218-1.9-1.213a6.208,6.208,0,0,0-2.881.77l-.577-1.973a8.255,8.255,0,0,1,3.986-.9c3.295,0,4.485,1.839,4.485,4.2v3.278a13.935,13.935,0,0,0,.157,2.372Zm-.36-4.5c-1.814-.017-3.039.392-3.039,1.472,0,.716.5,1.1,1.272,1.1a1.817,1.817,0,0,0,1.711-1.2,2.018,2.018,0,0,0,.056-.535Z" transform="translate(-7.969 -2.66)" fill="#382476"/>
        <path id="Path_83346" data-name="Path 83346" d="M39.441,10.192c0-1.3-.035-2.4-.079-3.293h2.72l.141,1.422h.039a4.25,4.25,0,0,1,3.6-1.657c2.1,0,4.336,1.673,4.336,4.877a4.812,4.812,0,0,1-4.789,5.209A3.352,3.352,0,0,1,42.611,15.6h-.039v4.844H39.441Zm3.131,2a3.781,3.781,0,0,0,.036.56A2.116,2.116,0,0,0,44.661,14.4c1.42,0,2.34-1.008,2.34-2.679,0-1.428-.764-2.66-2.285-2.66A2.166,2.166,0,0,0,42.624,10.8a2.509,2.509,0,0,0-.053.484Z" transform="translate(-15.717 -2.661)" fill="#382476"/>
        <path id="Path_83347" data-name="Path 83347" d="M63.49,2.4V5.2h2.242V7.529H63.49v3.18c0,1.174.229,1.795,1.249,1.795a3.984,3.984,0,0,0,.958-.1l.025,2.358a6.392,6.392,0,0,1-2.057.287,3.282,3.282,0,0,1-2.384-.909,4.106,4.106,0,0,1-.83-2.883V7.529H59.126V5.2h1.326V3.1Z" transform="translate(-23.608 -0.96)" fill="#382476"/>
        <path id="Path_83348" data-name="Path 83348" d="M76.48,1.526A1.678,1.678,0,1,1,74.811,0,1.542,1.542,0,0,1,76.48,1.526M73.235,4.239h3.132v9.614H73.235Z" transform="translate(-29.203 0)" fill="#382476"/>
        <path id="Path_83349" data-name="Path 83349" d="M82.452,13.812a6.53,6.53,0,0,0,2.838.785c.983,0,1.37-.306,1.37-.773,0-.5-.313-.717-1.507-1.049-2.143-.581-3.018-1.7-3-2.91,0-1.832,1.618-3.2,4.157-3.2a7.054,7.054,0,0,1,2.96.6l-.544,2.118a5.7,5.7,0,0,0-2.33-.594c-.754,0-1.21.259-1.21.76,0,.472.434.714,1.7,1.077,1.961.559,2.806,1.475,2.822,2.983,0,1.734-1.4,3.145-4.405,3.145a7.833,7.833,0,0,1-3.423-.719Z" transform="translate(-32.694 -2.661)" fill="#382476"/>
        <path id="Path_83350" data-name="Path 83350" d="M101.025,2.4V5.2h2.242V7.529h-2.242v3.18c0,1.174.229,1.795,1.249,1.795a3.984,3.984,0,0,0,.958-.1l.025,2.358a6.391,6.391,0,0,1-2.057.287,3.282,3.282,0,0,1-2.384-.909,4.106,4.106,0,0,1-.83-2.883V7.529H96.661V5.2h1.326V3.1Z" transform="translate(-38.595 -0.96)" fill="#382476"/>
        <path id="Path_83351" data-name="Path 83351" d="M123.451,7.855a6.311,6.311,0,0,0-2.918-3.689h0a6.214,6.214,0,0,0-2.152-.761h-1.992a6.332,6.332,0,1,0,7.328,6.253,6.166,6.166,0,0,0-.264-1.8m-6.068,5.65a3.845,3.845,0,1,1,3.846-3.846,3.846,3.846,0,0,1-3.846,3.846" transform="translate(-44.341 -1.36)" fill="#c3a55f"/>
        <path id="Path_83352" data-name="Path 83352" d="M151.005,3.407V15.991h-2.5V11.7L137.7,9.026v2.9h-2.766V5.373l2.766.687,10.809,2.682V3.407Z" transform="translate(-53.877 -1.36)" fill="#c3a55f"/>
        <rect id="Rectangle_147797" data-name="Rectangle 147797" width="8.706" height="2.958" transform="translate(99.187 2.047)" fill="#c3a55f"/>
        <rect id="Rectangle_147798" data-name="Rectangle 147798" width="8.706" height="2.958" transform="translate(99.187 6.86)" fill="#c3a55f"/>
        <rect id="Rectangle_147799" data-name="Rectangle 147799" width="8.706" height="2.958" transform="translate(99.187 11.673)" fill="#c3a55f"/>
      </g>
    </g>
  </g>
</svg>`;

export function SplashLogo() {
  const logoWidth = SCREEN_WIDTH * 0.48;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <SvgXml xml={splashSvg} width={logoWidth} height={(17.782 / 107.893) * logoWidth} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.poweredByText}>Powered by</Text>
        <Text style={styles.techText}>Rokswood{'\n'}Tech</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  poweredByText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  techText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
