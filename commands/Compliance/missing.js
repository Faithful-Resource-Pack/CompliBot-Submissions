/* global Buffer */
const prefix = process.env.PREFIX

// eslint-disable-next-line no-unused-vars
const Discord = require("discord.js")
const strings = require('../../resources/strings.json')
const settings = require('../../resources/settings.json')
const { mkdir } = require('fs/promises')
const filesystem = require("fs")
const { join, normalize } = require("path")
const os = require('os')

const { exec, series } = require('../../helpers/exec').promises
const { warnUser } = require('../../helpers/warnUser')

const COMPLIANCE_REPOS = {
  java: {
    '32': settings.repositories.raw.c32.java,
    '64': settings.repositories.raw.c64.java
  },
  bedrock: {
    '32': settings.repositories.raw.c32.bedrock,
    '64': settings.repositories.raw.c64.bedrock
  }
}

const ESCAPER = '+'
const RES_REPLACER = ESCAPER + 'RES' + ESCAPER
const EDITION_REPLACER = ESCAPER + 'EDITION' + ESCAPER
const PERCENT_REPLACER = ESCAPER + 'PERCENT' + ESCAPER
const CHANNEL_NAME_TEMPLATE = `${RES_REPLACER}x ${EDITION_REPLACER}: ${PERCENT_REPLACER}%`

const BEDROCK_UI = [
  "ui/Black.png",
  "ui/5stars_empty.png",
  "ui/5stars_empty_white.png",
  "ui/5stars_full.png",
  "ui/CreateNewWorld.png",
  "ui/DarkBannerNoBorder.png",
  "ui/Gray.png",
  "ui/Grey.png",
  "ui/HowToPlayDivider.png",
  "ui/InvalidWorldDemoScreen.png",
  "ui/LoadingWorldDemoScreen.png",
  "ui/NetherPortal.png",
  "ui/NetherPortalMirror.png",
  "ui/PlaceholderStore.png",
  "ui/RTX_Sparkle.png",
  "ui/RealmDemoScreen.png",
  "ui/Scaffolding.png",
  "ui/ScrollRail.png",
  "ui/StoreTopBarFiller.png",
  "ui/ThinPlus.png",
  "ui/WorldDemoScreen.png",
  "ui/banners_no_border.png",
  "ui/banners_no_border_dark_hover.png",
  "ui/barely_visible_creeper.png",
  "ui/bonus_banner.png",
  "ui/box_number_grey.png",
  "ui/break.png",
  "ui/button_borderless_imagelesshoverbg.png",
  "ui/button_dark_color.png",
  "ui/control.png",
  "ui/dark_bg.png",
  "ui/dark_minus.png",
  "ui/dark_plus.png",
  "ui/disabledButtonNoBorder.png",
  "ui/divider",
  "ui/dropDownHoverBG.png",
  "ui/dropDownSelectBG.png",
  "ui/easily_visible_creeper.png",
  "ui/feedIcon.png",
  "ui/feed_background.png",
  "ui/first_of_three.png",
  "ui/first_of_two.png",
  "ui/glyph_mashup_pack.png",
  "ui/glyph_realms.png",
  "ui/glyph_resource_pack.png",
  "ui/glyph_skin_pack.png",
  "ui/glyph_world_template.png",
  "ui/hammersmashedits.png",
  "ui/highlight_slot.png",
  "ui/ic_send_white_48dp.png",
  "ui/icon_agent.png",
  "ui/imagetaggedcorner.png",
  "ui/imagetaggedcornergreen.png",
  "ui/imagetaggedcornergreenhover.png",
  "ui/imagetaggedcornergreenpressed.png",
  "ui/inventory_warning_xbox.png",
  "ui/lightgreybars.png",
  "ui/list_item_divider_line_light.png",
  "ui/massive_servers.png",
  "ui/menubackground.png",
  "ui/middle_strip.png",
  "ui/minus.png",
  "ui/newTouchScrollBox.png",
  "ui/normalArm.png",
  "ui/normalHeight.png",
  "ui/not_visible_creeper.png",
  "ui/numberBGBack.png",
  "ui/numberBGFront.png",
  "ui/packs_middle.png",
  "ui/particles",
  "ui/permissions_player_fade_overlay.png",
  "ui/pinksquare.png",
  "ui/pinktriangle.png",
  "ui/plus.png",
  "ui/pointer.png",
  "ui/profile_new_look.png",
  "ui/profile_new_look_small.png",
  "ui/promo_bee.png",
  "ui/promo_chicken.png",
  "ui/promo_creeper.png",
  "ui/promo_pig_sheep.png",
  "ui/promo_spider.png",
  "ui/promo_wolf.png",
  "ui/purple_gradient.png",
  "ui/rating_screen.png",
  "ui/ratings_fullstar.png",
  "ui/ratings_nostar.png",
  "ui/realmflagSmooth.png",
  "ui/realmflagtriangleSmooth.png",
  "ui/realms_art_icon.png",
  "ui/realms_key_art.png",
  "ui/realms_particles.png",
  "ui/realms_text_background.png",
  "ui/realmsparkle.png",
  "ui/realmsparkle1.png",
  "ui/recipe_book_pane_bg.png",
  "ui/recipe_book_pane_bg.png",
  "ui/ribbon_bar_text_background_hover.png",
  "ui/saleflag.png",
  "ui/saleflagtriangle.png",
  "ui/screen_background.png",
  "ui/screen_realms_plus_background.png",
  "ui/second_of_three.png",
  "ui/second_of_two.png",
  "ui/shadow.png",
  "ui/slider_background.png",
  "ui/slider_background_hover.png",
  "ui/slider_locked_transparent_fade.png",
  "ui/slider_progress.png",
  "ui/slider_progress_hover.png",
  "ui/slider_step_background.png",
  "ui/slider_step_background_hover.png",
  "ui/slider_step_progress.png",
  "ui/slider_step_progress_hover.png",
  "ui/smallHeight.png",
  "ui/smallerHeight.png",
  "ui/smithing-table-plus.png",
  "ui/solidtransparency.png",
  "ui/store_background.png",
  "ui/store_banner_no_border.png",
  "ui/store_play_button_mask.png",
  "ui/storexblsignin.png",
  "ui/strikethru.png",
  "ui/sunset_keyart.png",
  "ui/sunset_pending_keyart.png",
  "ui/tallHeight.png",
  "ui/third_of_three.png",
  "ui/thinArm.png",
  "ui/title.png",
  "ui/tooltip_notification_default_background.png",
  "ui/touchScrollBox.png",
  "ui/underline.png",
  "ui/underline_focus.png",
  "ui/unsynced_bg_hover.png",
  "ui/user_icon.png",
  "ui/user_icon_small.png",
  "ui/user_icon_white.png",
  "ui/vertical_divider.png",
  "ui/verticalgradient.png",
  "ui/warning_alex.png",
  "ui/white_background.png",
  "ui/whiteline.png",
  "ui/yellow_banner.png",
  "entity/horse2/armor/horse_armor_none.png",
  "entity/horse2/horse_markings_none"
]

const VANILLA_REPOS = {
  java: settings.repositories.raw.default.java,
  bedrock: settings.repositories.raw.default.bedrock
}

const REPLACE_URLS = [
  ['raw.githubusercontent.com', 'github.com']
]

const _rawToRepoURL = function (val) {
  let result = val
  REPLACE_URLS.forEach(pair => {
    result = result.replace(pair[0], pair[1])
  })
  return result
}

const FOLDERS_NAMES = {
  vanilla: 'vanilla',
  compliance: 'compliance'
}

const normalizeArray = (arr) => arr.map(e => normalize(e))

const includesNone = function (arr, val) {
  let result = true

  let i = 0
  while (i < arr.length && result) {
    result = !val.includes(arr[i])
    ++i
  }

  return result
}

const _getAllFilesFromFolder = function (dir, filter = []) {
  let results = []

  filesystem.readdirSync(dir).forEach(function (file) {
    file = normalize(join(dir, file))
    const stat = filesystem.statSync(file)

    if (!file.includes('.git')) {
      if (stat && stat.isDirectory()) {
        results = results.concat(_getAllFilesFromFolder(file, filter))
      } else {
        if (file.endsWith('.png') && includesNone(filter, file)) {
          results.push(file)
        }
      }
    }
  })
  return results
};

module.exports = {
  name: 'missing',
  description: strings.command.description.missing,
  category: 'Compliance',
  guildOnly: false,
  uses: strings.command.use.anyone,
  syntax: `${prefix}missing <all|<32|64> <java|bedrock> [-u]>`,
  example: `${prefix}missing 32 java\n${prefix}missing 64 bedrock -u\n${prefix}missing all`,
  /**
   * @param {String} res resolution chosen
   * @param {String} edition edition chosen
   * @param { Function(String) } out output callback
   * @return {Promise<Buffer, Number, Number>} resolves if went well else error
   */
  compute: async function(res, edition, out) {
    let cbval = undefined
    if(out === undefined) out = async function() {}

    const vanilla_repo = _rawToRepoURL(VANILLA_REPOS[edition])
    const compliance_repo = _rawToRepoURL(COMPLIANCE_REPOS[edition][res])

    await out('Steps will be listed here').catch(err => {
      cbval = err
    })
    if(cbval !== undefined) return Promise.reject(cbval)

    let tmp_filepath = normalize(os.tmpdir())
    let vanilla_tmp_path, compliance_tmp_path

    vanilla_tmp_path = join(tmp_filepath, 'missing-' + FOLDERS_NAMES.vanilla + '-' + edition)
    compliance_tmp_path = join(tmp_filepath, 'missing-' + FOLDERS_NAMES.compliance + '-' + edition + '-' + res)

    let exists = filesystem.existsSync(vanilla_tmp_path)
    if (!exists) {
      await out(`Downloading vanilla ${edition} pack...`).catch(err => {
        cbval = err
      })
      if(cbval !== undefined) return Promise.reject(cbval)

      await mkdir(vanilla_tmp_path)
      await exec(`git clone ${vanilla_repo} .`, {
        cwd: vanilla_tmp_path
      })
    }
    exists = filesystem.existsSync(compliance_tmp_path)
    if (!exists) {
      await out(`Downloading Compliance ${res}x ${edition} pack...`).catch(err => {
        cbval = err
      })
      if(cbval !== undefined) return Promise.reject(cbval)

      await mkdir(compliance_tmp_path)
      await exec(`git clone ${compliance_repo} .`, {
        cwd: compliance_tmp_path
      })
  }

    await out('Updating packs with latest version known...').catch(err => {
      cbval = err
    })
    if(cbval !== undefined) return Promise.reject(cbval)

    const last_version = edition === 'bedrock' ? settings.versions.bedrock[0] : '1.18.2' // remove this comment after 1.19 has releases settings.versions.java.sort(sorterMC).reverse()[0]

    // anyway stash
    // checkout latest branch
    // pull
    await Promise.all([
      series([
        'git stash',
        `git fetch origin ${last_version}`, // necessary to get created branches
        `git checkout ${last_version}`,
        `git pull`
      ], {
        cwd: vanilla_tmp_path
      }),
      series([
        'git stash',
        `git fetch origin ${last_version}`, // necessary to get created branches
        `git checkout ${last_version}`,
        `git pull`
      ], {
        cwd: compliance_tmp_path
      })
    ]).catch(err => {
      cbval = err
    })
    if(cbval !== undefined) return Promise.reject(cbval)

    await out(`Searching for differences...`).catch(err => {
      cbval = err
    })
    if(cbval !== undefined) return Promise.reject(cbval)

    const edition_filter = edition === 'java' ? normalizeArray(['font/', 'colormap/', 'misc/shadow', 'presets/isles', 'realms/inspiration', 'realms/new_world', 'realms/survival_spawn', 'realms/upload', 'realms/adventure', 'realms/experience', 'environment/clouds', 'misc/nausea', 'misc/vignette', 'realms/darken', 'realms/plus_icon', 'models/armor/piglin_leather_layer_1', 'misc/white.png', 'block/lightning_rod_on.png', 'gui/title/background/panorama_overlay.png', 'effect/dither.png', 'misc/unknown_server.png', 'entity/llama/spit.png', 'block/redstone_dust_overlay.png', 'entity/enderman/enderman_eyes.png', 'entity/phantom_eyes.png', 'block/water_overlay.png', 'entity/end_portal.png', 'item/leather_chestplate_overlay.png']) : normalizeArray([...BEDROCK_UI, 'font/', 'colormap/', '/gui/', 'environments/clouds', 'persona_thumbnails/', 'environment/end_portal_colors', 'textures/flame_atlas', 'textures/forcefield_atlas', 'blocks/bed_feet_', 'blocks/bed_head_', 'blocks/flower_paeonia', 'blocks/flower_rose_blue', 'blocks/structure_air', 'map/player_icon_background', 'misc/missing_texture', 'items/boat', 'items/egg_agent', 'items/quiver', 'items/ruby', 'entity/agent.png', 'entity/cape_invisible.png', 'entity/char.png', 'entity/horse/', 'entity/lead_rope.png', 'entity/loyalty_rope.png', 'entity/pig/pigzombie.png', 'entity/villager/', 'entity/wither_boss/wither_armor_blue.png', 'entity/zombie_villager/'])

    const vanilla_textures = _getAllFilesFromFolder(vanilla_tmp_path, edition_filter).map(f => normalize(f).replace(vanilla_tmp_path, ''))
    const compliance_textures = _getAllFilesFromFolder(compliance_tmp_path).map(f => normalize(f).replace(compliance_tmp_path, ''))

    // I have no clue what this dark magic does, but it is faster than the previous solution and doesn't use any dependencies
    var objA = {};
    compliance_textures.forEach(function(v) { objA[v] = true; });
    const diff_result = vanilla_textures.filter(function(v) { return !objA[v]; });

    const result_buffer = Buffer.from(diff_result.join('\n').replace(/\\/g,'/').replace(/\/assets\/minecraft/g,'').replace(/\/textures\//g,''), 'utf8')

    const progress = Math.round(10000 - diff_result.length / vanilla_textures.length * 10000) / 100

    return Promise.resolve([result_buffer, diff_result, progress])
  },
  
  /**
   * @param {Discord.Client} client discord client to act
   * @param {String} res resolution chosen
   * @param {String} edition edition chosen
   * @param { Function(String) } out output callback
   * @return {Promise<Buffer, Number, Number>} resolves if went well else error
   */
  computeAndUpdate: async function(client, res, edition, out) {
    return this.compute(res, edition, out)
      .then(async (results) => {
        const progress = results[2]
        
        if(client !== null) {
          const ucEdition = edition.charAt(0).toUpperCase() + edition.substr(1)
          const channelName = CHANNEL_NAME_TEMPLATE
            .replace(RES_REPLACER, res)
            .replace(EDITION_REPLACER, ucEdition)
            .replace(PERCENT_REPLACER, String(progress))

            /** @type {Discord.TextChannel} */
            const channelID = settings.channels.percentages[res][edition]
            let channel = client.channels.cache.get(channelID)

            // fetch channel if failed to get it
            if(!channel) {
              channel = await client.channels.fetch(channelID).catch(() => {})
            }
        
            // happens when the channel exists
            let ret_err // = undefined 
            if(channel !== undefined) {
              await channel.setName(channelName).catch(err => {
                ret_err = err
              })
              if(ret_err !== undefined) return Promise.reject(ret_err)
            } else {
              console.log('Final channel name would be', channelName)
            }
        }

        return Promise.resolve(results)
      })
  },
  /**
   * Computes all
   * @param {Discord.Client} client Discord client to act
   * @param {Function(String): Promise} out Callback out steps
   * @returns {Promise<void>} 
   */
  computeAndUpdateAll: function(client, out = undefined) {
    const editions = settings.editions.map(e => e.toLowerCase())
    const resolutions = settings.resolutions.map(r => String(parseInt(r)))
    const editions_and_resolutions = editions.map(e => resolutions.map(r => [e, r])).flat()

    // recursive async function to series updates
    const startNext = (arr, out, results) => {
      if(out === undefined) out = async function() {}
      if(results === undefined) results = []
      if(arr.length === 0) return Promise.resolve(results)

      out('') // reset steps

      const er = arr.shift()
      return this.computeAndUpdate(client, er[1], er[0], out)
        .then(result => {
          results.push({
            res: er[1],
            edition: er[0],
            result: result
          })

          return startNext(arr, out, results)
        })
    }

    return startNext(editions_and_resolutions, out)
  },
  /**
   * @param {Discord.Client} client Discord client using this command
   * @param {Discord.Message} message Incoming message matching
   * @param {Array<string>} args Arguments after the command
   * @author TheRolf
   */
  execute: async function (client, message, args) {
    const exampleCommand =  strings.command.missing.example.replace('%prefix%', prefix)

    // no args specified
		if (!args) return warnUser(message, strings.command.args.none_given + exampleCommand)

    let all = args.length === 1 && args[0] === 'all'

    let updateChannel, res, edition
    if(!all) {
      // invalid resolution specified
      if (args[0] != '32' && args[0] != '64') return warnUser(message, strings.command.missing.invalid_resolution + exampleCommand)
  
      // no edition specified
      if (!args[1]) return warnUser(message, strings.command.missing.no_edition + exampleCommand)
  
      // invalid edition specified
      if (args[1] != 'java' && args[1] != 'bedrock') return warnUser(message, strings.command.missing.invalid_edition + exampleCommand)
      

      updateChannel = args.length > 2 && args[2].trim() === '-u'

      res = args[0].trim().toLowerCase()
      edition = args[1].trim().toLowerCase()
    }

    let embed = new Discord.MessageEmbed()
      .setTitle('Searching for missing textures...')
      .setDescription('This takes some time, please wait...')
      .setThumbnail(settings.images.loading)
      .setColor(settings.colors.blue)
      .addField('Steps', 'Steps will be listed here')

    let embedMessage = await message.reply({ embeds: [embed] })
    let steps = []

    let step_callback = async (step) => {
      if(step === '') {
        steps = ['Next one...']
      } else {
        if(steps.length === 1 && steps[0] === 'Next one...') steps = [] 
        steps.push(step)
      }

      embed.fields[0].value = steps.join('\n')
      await embedMessage.edit({ embeds: [embed] })
    }

    let prom // = undefined
    if(all) {
      prom = this.computeAndUpdateAll(client, step_callback)
    } else {
      if(updateChannel) {
        prom = this.compute(res, edition, step_callback)
      } else {
        prom = this.computeAndUpdate(client, res, edition, step_callback)
      }
    }
    
    prom.then(async (responses) => {
      const files = []
      if(responses.length && !responses[0].res) {
        responses = [{
          res: res,
          edition: edition,
          result: responses
        }]
      }
      responses.forEach((result_buffer) => {
        files.push(new Discord.MessageAttachment(result_buffer.result[0], `missing-${result_buffer.res}-${result_buffer.edition}.txt`));
      })

      let resultEmbed = new Discord.MessageEmbed()

      responses.forEach(response => {
        const result = response.result
        const res = response.res
        const edition = response.edition
        const diff_result = result[1]
        const progress = result[2]

        resultEmbed
          .addField(`Compliance ${res}x ${edition} progress:`, progress + `% complete\n ${diff_result.length} textures missing`)
          .setColor(settings.colors.blue)
      })
  
      await embedMessage.edit({ embeds: [resultEmbed], files: files })
      
      if(updateChannel) {
        await embedMessage.react(settings.emojis.upvote)
      }
    })
    .catch(err => {
      let errMessage = err.message
      if(!errMessage) {
        console.error(errMessage)
        errMessage = 'An error occured when launching missing command. Please check console error output for more infos'
      }
      return warnUser(message, errMessage)
    })
  }
};