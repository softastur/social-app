import React from 'react'
import {Keyboard, Pressable, View} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  moderateFeedGenerator,
  moderateProfile,
  ModerationOpts,
  ModerationUI,
} from '@atproto/api'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {DISCOVER_FEED_URI} from 'lib/constants'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {isWeb} from 'platform/detection'
import {useSession} from 'state/session'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {WizardAction, WizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Checkbox} from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'

function WizardListCard({
  type,
  displayName,
  subtitle,
  onPress,
  avatar,
  included,
  disabled,
  moderationUi,
}: {
  type: 'user' | 'algo'
  profile?: AppBskyActorDefs.ProfileViewBasic
  feed?: AppBskyFeedDefs.GeneratorView
  displayName: string
  subtitle: string
  onPress: () => void
  avatar?: string
  included?: boolean
  disabled?: boolean
  moderationUi: ModerationUI
}) {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <Pressable
      accessibilityRole="button"
      style={[
        a.flex_row,
        a.align_center,
        a.px_lg,
        a.py_sm,
        a.gap_md,
        a.border_b,
        t.atoms.border_contrast_low,
        // @ts-expect-error web only
        isWeb && {
          cursor: 'default',
        },
      ]}
      onPress={onPress}>
      <UserAvatar
        size={45}
        avatar={avatar}
        moderation={moderationUi}
        type={type}
      />
      <View style={[a.flex_1]}>
        <Text style={[a.flex_1, a.font_bold, a.text_md]} numberOfLines={1}>
          {displayName}
        </Text>
        <Text
          style={[a.flex_1, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Toggle.Item
        name={type === 'user' ? _(msg`Person toggle`) : _(msg`Feed toggle`)}
        label={
          included
            ? _(msg`Remove ${displayName} from starter pack`)
            : _(msg`Add ${displayName} to starter pack`)
        }
        value={included}
        disabled={disabled}
        onChange={onPress}>
        <Checkbox />
      </Toggle.Item>
    </Pressable>
  )
}

export function WizardProfileCard({
  state,
  dispatch,
  profile,
  moderationOpts,
}: {
  state: WizardState
  dispatch: (action: WizardAction) => void
  profile: AppBskyActorDefs.ProfileViewBasic
  moderationOpts: ModerationOpts
}) {
  const {currentAccount} = useSession()

  const included = state.profiles.some(p => p.did === profile.did)
  const isMe = profile.did === currentAccount?.did
  const disabled = isMe || state.profiles.length >= 50
  const moderationUi = moderateProfile(profile, moderationOpts).ui('avatar')
  const displayName = profile.displayName
    ? sanitizeDisplayName(profile.displayName)
    : `@${sanitizeHandle(profile.handle)}`

  const onPress = () => {
    if (disabled) return

    Keyboard.dismiss()
    if (profile.did === currentAccount?.did) return

    if (!included) {
      dispatch({type: 'AddProfile', profile})
    } else {
      dispatch({type: 'RemoveProfile', profileDid: profile.did})
    }
  }

  return (
    <WizardListCard
      type="user"
      displayName={displayName}
      subtitle={`@${sanitizeHandle(profile.handle)}`}
      onPress={onPress}
      avatar={profile.avatar}
      included={included}
      disabled={disabled}
      moderationUi={moderationUi}
    />
  )
}

export function WizardFeedCard({
  generator,
  state,
  dispatch,
  moderationOpts,
}: {
  generator: GeneratorView
  state: WizardState
  dispatch: (action: WizardAction) => void
  moderationOpts: ModerationOpts
}) {
  const isDiscover = generator.uri === DISCOVER_FEED_URI
  const included = isDiscover || state.feeds.some(f => f.uri === generator.uri)
  const disabled = isDiscover || (!included && state.feeds.length >= 3)
  const moderationUi = moderateFeedGenerator(generator, moderationOpts).ui(
    'avatar',
  )

  const onPress = () => {
    if (disabled) return

    Keyboard.dismiss()
    if (included) {
      dispatch({type: 'RemoveFeed', feedUri: generator.uri})
    } else {
      dispatch({type: 'AddFeed', feed: generator})
    }
  }

  return (
    <WizardListCard
      type="algo"
      displayName={sanitizeDisplayName(generator.displayName)}
      subtitle={`Feed by @${sanitizeHandle(generator.creator.handle)}`}
      onPress={onPress}
      avatar={generator.avatar}
      included={included}
      disabled={disabled}
      moderationUi={moderationUi}
    />
  )
}