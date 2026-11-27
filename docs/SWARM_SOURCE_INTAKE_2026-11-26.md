# Source intake — 2026-11-26

Original AutoMind remains the conductor. This intake preserves separate donor versions rather than replacing or merging their implementations.

## Original AutoMind
- Source: [AutoMind-main.zip](https://drive.google.com/file/d/1KTfBH69E6t6iI6Ra2gBXf5rdcX7YoohH/view).
- Existing repository inventory records SHA-256 `abcf01eae58980201c7b710998a0b503762a5f629a77fe901a966a17d3dd2b61` and a byte-for-byte import of 1,155 files.
- This commit reuses the untouched import tree `2a855484d45ca62fb3157a4a2b0dd67903c59683` from commit `2d938b347dbe745e6b64a6bee8dfdbfd63bd313d` at `vendor/automind`. The ZIP itself is not included.
- Existing adapted conductor and swarm work remains on [integration/synthia-swarm-os](https://github.com/justappgrabbin/Automind-POP/tree/integration/synthia-swarm-os). Do not overwrite it with the untouched source.

## Uploaded donor packages awaiting binary transfer

| Filename | Bytes | SHA-256 | Role |
| --- | ---: | --- | --- |
| Synthia_GameEngineX_teacher_settings-2.zip | 53604538 | 30c77fc1d58513561ef219b0d076cba7833f43da3d94722160df45eddb97d27f | GameEngineX, swarm, optional teacher settings |
| synthia_v62_relationship_integration.zip | 9612421 | 5d91064fed8825d45ae5a988b6f17e58101daa8369e8043ccddf29b4aa49bdc4 | Relationship mechanics and regression baseline |
| morphogenesis-resources-main.zip | 48365012 | c6566258f15cd977dff7e281471d42aa091e0c9071cfd72c480e07b328a28c3f | Research catalog; [upstream](https://github.com/jasonwebb/morphogenesis-resources) |
| justappgrabbin_Automind-POP.mht | Not transferred | 5771608e6a4098989b89f4c1a7d3707322cb8d6165ade76dc20acf08c3e246be | Browser snapshot, not executable source |

The four local uploads have not been copied to GitHub; the available GitHub write interface does not accept local file references. Review embedded Git metadata, credentials, private browser content, and third-party redistribution rights before adding the raw files to this public repository. Keep separate source versions, restore the v62 relationship regression in the GameEngineX version without removing newer capabilities, and verify both test suites before integrating the combined organism. This is an intake record, not a claim of completed integration.
